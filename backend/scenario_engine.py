"""
ECH Scenario Simulation Engine
Based on real market data and clear cause-effect logic
Enhanced with Prophet forecasting
"""

import numpy as np
import json
from datetime import datetime, timedelta
from models import get_scenario, get_all_scenarios, get_market_data, MARKET_DATA
from dateutil.relativedelta import relativedelta

# Try to import Prophet, fallback gracefully if not available
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    try:
        from fbprophet import Prophet
        PROPHET_AVAILABLE = True
    except ImportError:
        PROPHET_AVAILABLE = False
        print("Warning: Prophet not installed. Using simple forecast fallback.")
        print("Install with: pip install prophet")

import pandas as pd
import logging

# Suppress Prophet's verbose logging
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)


class ScenarioEngine:
    def __init__(self, data_path='data/synthetic_data.json'):
        """Initialize with baseline price data"""
        with open(data_path, 'r') as f:
            self.baseline_data = json.load(f)
        
        self.dates = self.baseline_data['dates']
        self.prices = self.baseline_data['prices']
        self.market = MARKET_DATA
        
        # Region mapping
        self.regions = ['us_ech', 'eu_ech', 'asia_ech', 'china_ech']
        
        # Prophet configuration
        self.prophet_config = {
            'yearly_seasonality': True,
            'weekly_seasonality': False,
            'daily_seasonality': False,
            'seasonality_mode': 'multiplicative',
            'changepoint_prior_scale': 0.05,  # Flexibility of trend
            'seasonality_prior_scale': 10,     # Flexibility of seasonality
            'interval_width': 0.95             # 95% confidence interval
        }
        
    def apply_scenario(self, scenario_id, custom_params=None):
        """
        Main entry point: apply scenario and return results
        """
        scenario = get_scenario(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        # Merge custom parameters with defaults
        params = scenario['parameters'].copy()
        if custom_params:
            for key, value in custom_params.items():
                if key in params:
                    params[key] = value
        
        # Calculate price effects using scenario-specific logic
        price_effects = self._calculate_price_effects(scenario, params)
        
        # Apply effects to generate simulated prices
        simulated_prices = self._apply_effects(price_effects, params)
        
        # Calculate summary metrics
        metrics = self._calculate_metrics(simulated_prices)
        
        # Generate forecast using Prophet (with fallback)
        forecast = self._generate_forecast(simulated_prices, params)
        
        return {
            'scenario_id': scenario_id,
            'scenario_name': scenario['name'],
            'scenario_category': scenario['category'],
            'scenario_description': scenario['description'],
            'affected_regions': scenario['affected_regions'],
            'parameters_used': params,
            'price_effects': {k: round(v * 100, 2) for k, v in price_effects.items()},
            'simulated_prices': simulated_prices,
            'baseline_prices': self.prices,
            'metrics': metrics,
            'forecast': forecast,
            'dates': self.dates
        }
    
    def _calculate_price_effects(self, scenario, params):
        """
        Calculate price effect (% change) for each region based on scenario logic.
        Returns dict: {'us_ech': 0.05, ...} meaning +5% effect
        """
        logic = scenario.get('logic', 'default')
        
        # Dispatch to specific logic handler
        handlers = {
            'demand_growth': self._logic_demand_growth,
            'apac_growth': self._logic_apac_growth,
            'bio_adoption': self._logic_bio_adoption,
            'epoxy_demand': self._logic_epoxy_demand,
            'feedstock_shift': self._logic_feedstock_shift,
            'eu_regulatory': self._logic_eu_regulatory,
            'asian_advantage': self._logic_asian_advantage,
            'plant_shutdown': self._logic_plant_shutdown,
            'supply_disruption': self._logic_supply_disruption,
            'capacity_expansion': self._logic_capacity_expansion,
            'americas_stability': self._logic_americas_stability,
            'europe_elevation': self._logic_europe_elevation,
            'apac_pressure': self._logic_apac_pressure,
            'asian_undercut': self._logic_asian_undercut,
            'eu_constraints': self._logic_eu_constraints,
            'us_stable': self._logic_us_stable,
        }
        
        handler = handlers.get(logic, self._logic_default)
        return handler(params)
    
    # ==================== DEMAND SCENARIOS ====================
    
    def _logic_demand_growth(self, params):
        """
        Global demand growth: 3.3% CAGR baseline
        Price effect = demand_growth * price_elasticity
        """
        growth = params.get('demand_growth_rate', 0.033)
        elasticity = params.get('price_elasticity', 0.6)
        duration_years = params.get('duration_months', 24) / 12
        
        # Cumulative effect over duration
        cumulative_growth = growth * duration_years
        price_effect = cumulative_growth * elasticity
        
        return {
            'us_ech': price_effect * 0.9,
            'eu_ech': price_effect * 1.0,
            'asia_ech': price_effect * 1.1,
            'china_ech': price_effect * 1.15
        }
    
    def _logic_apac_growth(self, params):
        """
        APAC accelerated growth: 59% of market growing faster
        """
        premium = params.get('apac_growth_premium', 0.02)
        spillover = params.get('global_spillover', 0.3)
        duration_years = params.get('duration_months', 18) / 12
        
        apac_effect = premium * duration_years * 0.6
        global_effect = apac_effect * spillover * 0.59
        
        return {
            'us_ech': global_effect,
            'eu_ech': global_effect * 1.1,
            'asia_ech': apac_effect,
            'china_ech': apac_effect * 1.1
        }
    
    def _logic_bio_adoption(self, params):
        """
        Bio-based ECH (glycerine) growing at 4% CAGR
        """
        adoption = params.get('bio_adoption_rate', 0.04)
        glycerine_cost = params.get('glycerine_cost_factor', 1.0)
        duration_years = params.get('duration_months', 36) / 12
        
        bio_effect = adoption * duration_years
        
        return {
            'us_ech': bio_effect * 0.02,
            'eu_ech': bio_effect * glycerine_cost * 0.08,
            'asia_ech': bio_effect * -0.05,
            'china_ech': bio_effect * -0.06
        }
    
    def _logic_epoxy_demand(self, params):
        """
        86% of ECH goes to epoxy. Infrastructure/electronics demand drives prices.
        """
        epoxy_growth = params.get('epoxy_demand_growth', 0.05)
        infra_boost = params.get('infrastructure_boost', 0.0)
        duration_years = params.get('duration_months', 12) / 12
        
        total_demand = (epoxy_growth + infra_boost) * 0.86
        price_effect = total_demand * duration_years * 0.7
        
        return {
            'us_ech': price_effect * 0.9,
            'eu_ech': price_effect * 1.0,
            'asia_ech': price_effect * 1.1,
            'china_ech': price_effect * 1.15
        }
    
    # ==================== FEEDSTOCK SCENARIOS ====================
    
    def _logic_feedstock_shift(self, params):
        """
        Shift between glycerine and propylene routes affects cost structure
        """
        glycerine_shift = params.get('glycerine_share_change', 0.1)
        propylene_change = params.get('propylene_price_change', 0.0)
        glycerine_change = params.get('glycerine_price_change', 0.0)
        
        return {
            'us_ech': propylene_change * 0.4 + glycerine_shift * 0.02,
            'eu_ech': propylene_change * 0.35 + glycerine_change * 0.15 + glycerine_shift * 0.05,
            'asia_ech': glycerine_change * 0.4 - glycerine_shift * 0.04,
            'china_ech': glycerine_change * 0.45 - glycerine_shift * 0.05
        }
    
    def _logic_eu_regulatory(self, params):
        """
        EU deforestation regulations restrict glycerine supply
        """
        supply_cut = params.get('supply_reduction', 0.15)
        compliance = params.get('compliance_cost', 0.10)
        duration_years = params.get('duration_months', 36) / 12
        
        eu_effect = (supply_cut * 0.5 + compliance) * min(duration_years, 2)
        
        return {
            'us_ech': supply_cut * 0.02,
            'eu_ech': eu_effect,
            'asia_ech': -supply_cut * 0.02,
            'china_ech': -supply_cut * 0.03
        }
    
    def _logic_asian_advantage(self, params):
        """
        Lower glycerine costs in Asia = price advantage
        """
        cost_advantage = params.get('glycerine_cost_advantage', 0.15)
        intensity = params.get('competitive_intensity', 0.5)
        duration_years = params.get('duration_months', 18) / 12
        
        asia_effect = -cost_advantage * intensity * min(duration_years, 1.5)
        
        return {
            'us_ech': -cost_advantage * intensity * 0.3,
            'eu_ech': -cost_advantage * intensity * 0.2,
            'asia_ech': asia_effect,
            'china_ech': asia_effect * 1.1
        }
    
    # ==================== SUPPLY SCENARIOS ====================
    
    def _logic_plant_shutdown(self, params):
        """
        Capacity goes offline - supply shock increases prices
        """
        offline = params.get('capacity_offline', 0.10)
        region = params.get('region_affected', 'eu')
        duration_months = params.get('duration_months', 6)
        
        supply_elasticity = 1.7
        direct_effect = offline * supply_elasticity
        
        effects = {
            'us_ech': 0.0,
            'eu_ech': 0.0,
            'asia_ech': 0.0,
            'china_ech': 0.0
        }
        
        duration_factor = min(duration_months / 6, 1.5)
        
        if region == 'eu':
            effects['eu_ech'] = direct_effect * duration_factor
            effects['us_ech'] = direct_effect * 0.2
            effects['asia_ech'] = direct_effect * 0.15
            effects['china_ech'] = direct_effect * 0.1
        elif region == 'us':
            effects['us_ech'] = direct_effect * duration_factor
            effects['eu_ech'] = direct_effect * 0.15
        elif region in ['asia', 'china']:
            effects['asia_ech'] = direct_effect * duration_factor * 0.9
            effects['china_ech'] = direct_effect * duration_factor
            effects['eu_ech'] = direct_effect * 0.1
            effects['us_ech'] = direct_effect * 0.05
        
        return effects
    
    def _logic_supply_disruption(self, params):
        """
        Global supply chain disruption
        """
        severity = params.get('disruption_severity', 0.20)
        recovery = params.get('recovery_months', 4)
        duration = params.get('duration_months', 8)
        
        peak_effect = severity * 1.5
        avg_effect = peak_effect * (1 - recovery / (duration * 2))
        
        return {
            'us_ech': avg_effect * 0.8,
            'eu_ech': avg_effect * 1.0,
            'asia_ech': avg_effect * 0.9,
            'china_ech': avg_effect * 0.85
        }
    
    def _logic_capacity_expansion(self, params):
        """
        New capacity = oversupply = price decline
        """
        addition = params.get('capacity_addition', 0.15)
        ramp_up = params.get('ramp_up_months', 6)
        duration = params.get('duration_months', 24)
        
        effective_addition = addition * (1 - ramp_up / (duration * 2))
        price_effect = -effective_addition * 0.8
        
        return {
            'us_ech': price_effect * 0.4,
            'eu_ech': price_effect * 0.5,
            'asia_ech': price_effect * 1.0,
            'china_ech': price_effect * 1.1
        }
    
    # ==================== REGIONAL SCENARIOS ====================
    
    def _logic_americas_stability(self, params):
        """
        US market isolated from global volatility
        """
        isolation = params.get('isolation_factor', 0.7)
        pressure = params.get('competitive_pressure', 0.0)
        
        return {
            'us_ech': -pressure * 0.5,
            'eu_ech': 0.02 * (1 - isolation),
            'asia_ech': 0.03 * (1 - isolation),
            'china_ech': 0.03 * (1 - isolation)
        }
    
    def _logic_europe_elevation(self, params):
        """
        EU capacity reduction -> price premium
        """
        reduction = params.get('capacity_reduction', 0.12)
        import_dep = params.get('import_dependency', 0.2)
        duration_years = params.get('duration_months', 18) / 12
        
        eu_effect = reduction * 1.5 + import_dep * 0.3
        eu_effect *= min(duration_years, 1.5)
        
        return {
            'us_ech': reduction * 0.1,
            'eu_ech': eu_effect,
            'asia_ech': -reduction * 0.05,
            'china_ech': -reduction * 0.05
        }
    
    def _logic_apac_pressure(self, params):
        """
        Asia prices rise from feedstock + shutdowns
        """
        feedstock = params.get('feedstock_pressure', 0.08)
        shutdown = params.get('shutdown_impact', 0.05)
        duration_years = params.get('duration_months', 12) / 12
        
        combined = (feedstock + shutdown * 1.5) * min(duration_years, 1)
        
        return {
            'us_ech': combined * 0.15,
            'eu_ech': combined * 0.2,
            'asia_ech': combined,
            'china_ech': combined * 1.1
        }
    
    # ==================== COMPETITIVE SCENARIOS ====================
    
    def _logic_asian_undercut(self, params):
        """
        Asian producers undercut global prices
        """
        discount = params.get('price_discount', 0.10)
        share_target = params.get('market_share_target', 0.05)
        duration_years = params.get('duration_months', 18) / 12
        
        asia_cut = -discount * min(duration_years, 1.5)
        pressure = discount * share_target * 5
        
        return {
            'us_ech': -pressure * 0.6,
            'eu_ech': -pressure * 0.5,
            'asia_ech': asia_cut,
            'china_ech': asia_cut * 1.1
        }
    
    def _logic_eu_constraints(self, params):
        """
        EU supply constraints allow price increases
        """
        constraint = params.get('supply_constraint', 0.15)
        power = params.get('pricing_power', 0.8)
        duration_years = params.get('duration_months', 24) / 12
        
        eu_increase = constraint * power * min(duration_years, 2)
        
        return {
            'us_ech': constraint * 0.05,
            'eu_ech': eu_increase,
            'asia_ech': -constraint * 0.03,
            'china_ech': -constraint * 0.04
        }
    
    def _logic_us_stable(self, params):
        """
        US stable production anchors market
        """
        stability = params.get('output_stability', 0.95)
        vol_reduction = params.get('price_volatility_reduction', 0.3)
        
        return {
            'us_ech': 0.0,
            'eu_ech': 0.01,
            'asia_ech': 0.015,
            'china_ech': 0.02
        }
    
    def _logic_default(self, params):
        """Fallback: no effect"""
        return {r: 0.0 for r in self.regions}
    
    # ==================== APPLY EFFECTS ====================
    
    def _apply_effects(self, effects, params):
        """
        Apply calculated effects to baseline prices
        """
        simulated = {}
        duration = params.get('duration_months', 12)
        total_periods = len(self.dates)
        
        seed = int(abs(hash(frozenset(params.items()))) % 100000)
        np.random.seed(seed)
        
        for region in self.regions:
            if region not in self.prices:
                continue
            
            baseline = np.array(self.prices[region])
            result = baseline.copy()
            
            effect = effects.get(region, 0)
            
            start = int(total_periods * 0.2)
            ramp = min(6, duration // 3)
            end = min(start + duration, total_periods)
            
            for i in range(start, total_periods):
                if i < start + ramp:
                    progress = (i - start + 1) / ramp
                    current_effect = effect * progress
                elif i < end:
                    current_effect = effect
                else:
                    decay = min((i - end) / 12, 1.0)
                    current_effect = effect * (1 - decay * 0.4)
                
                noise = np.random.normal(0, 0.008)
                result[i] = baseline[i] * (1 + current_effect + noise)
            
            simulated[region] = result.tolist()
        
        return simulated
    
    def _calculate_metrics(self, simulated):
        """Calculate summary metrics"""
        metrics = {}
        
        for region in self.regions:
            if region not in simulated or region not in self.prices:
                continue
            
            baseline = np.array(self.prices[region])
            sim = np.array(simulated[region])
            
            base_avg = float(np.mean(baseline))
            sim_avg = float(np.mean(sim))
            
            metrics[region] = {
                'baseline_avg': round(base_avg, 4),
                'simulated_avg': round(sim_avg, 4),
                'change_percent': round((sim_avg - base_avg) / base_avg * 100, 2),
                'max_price': round(float(np.max(sim)), 4),
                'min_price': round(float(np.min(sim)), 4)
            }
        
        return metrics
    
    # ==================== PROPHET FORECASTING ====================
    
    def _generate_forecast(self, simulated, params, months=12):
        """
        Generate forecast using Prophet with fallback to simple method.
        Returns forecast with point estimates and confidence intervals.
        """
        if PROPHET_AVAILABLE:
            try:
                return self._generate_prophet_forecast(simulated, params, months)
            except Exception as e:
                print(f"Prophet forecast failed: {e}. Using fallback.")
                return self._generate_simple_forecast(simulated, params, months)
        else:
            return self._generate_simple_forecast(simulated, params, months)
    
    def _generate_prophet_forecast(self, simulated, params, months=12):
        """
        Prophet-based forecasting with:
        - Automatic seasonality detection
        - Trend changepoint detection
        - Uncertainty intervals
        - Scenario effect continuation
        """
        forecast = {}
        
        # Calculate ongoing scenario effect for regressors
        scenario_duration = params.get('duration_months', 12)
        total_periods = len(self.dates)
        scenario_end_idx = int(total_periods * 0.2) + scenario_duration
        scenario_ongoing = scenario_end_idx > total_periods
        
        for region, prices in simulated.items():
            # Prepare data for Prophet
            df = pd.DataFrame({
                'ds': pd.to_datetime(self.dates),
                'y': prices
            })
            
            # Initialize Prophet model
            model = Prophet(
                yearly_seasonality=self.prophet_config['yearly_seasonality'],
                weekly_seasonality=self.prophet_config['weekly_seasonality'],
                daily_seasonality=self.prophet_config['daily_seasonality'],
                seasonality_mode=self.prophet_config['seasonality_mode'],
                changepoint_prior_scale=self.prophet_config['changepoint_prior_scale'],
                seasonality_prior_scale=self.prophet_config['seasonality_prior_scale'],
                interval_width=self.prophet_config['interval_width']
            )
            
            # Add scenario effect as regressor if ongoing
            if scenario_ongoing:
                # Create scenario effect regressor
                df['scenario_effect'] = self._create_scenario_regressor(
                    len(prices), 
                    params, 
                    total_periods
                )
                model.add_regressor('scenario_effect', mode='multiplicative')
            
            # Fit model (suppress output)
            model.fit(df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=months, freq='MS')
            
            # Add scenario effect for future periods if ongoing
            if scenario_ongoing:
                future['scenario_effect'] = self._extend_scenario_regressor(
                    future, 
                    params, 
                    total_periods, 
                    months
                )
            
            # Generate forecast
            prophet_forecast = model.predict(future)
            
            # Extract forecast for future periods only
            future_forecast = prophet_forecast.tail(months)
            
            forecast[region] = {
                'point': [round(x, 4) for x in future_forecast['yhat'].tolist()],
                'lower_95': [round(x, 4) for x in future_forecast['yhat_lower'].tolist()],
                'upper_95': [round(x, 4) for x in future_forecast['yhat_upper'].tolist()],
                'trend': [round(x, 4) for x in future_forecast['trend'].tolist()]
            }
            
            # Add seasonality components if available
            if 'yearly' in future_forecast.columns:
                forecast[region]['seasonality'] = [
                    round(x, 4) for x in future_forecast['yearly'].tolist()
                ]
        
        # Generate forecast dates using proper month arithmetic
        last_date = datetime.strptime(self.dates[-1], '%Y-%m-%d')
        forecast['dates'] = [
            (last_date + relativedelta(months=i + 1)).strftime('%Y-%m-%d')
            for i in range(months)
        ]
        
        # Add metadata
        forecast['model'] = 'prophet'
        forecast['confidence_interval'] = '95%'
        
        return forecast
    
    def _create_scenario_regressor(self, n_periods, params, total_periods):
        """
        Create scenario effect regressor for historical data.
        Models the ramp-up, full effect, and decay phases.
        """
        duration = params.get('duration_months', 12)
        start = int(total_periods * 0.2)
        ramp = min(6, duration // 3)
        end = min(start + duration, total_periods)
        
        regressor = np.zeros(n_periods)
        
        for i in range(n_periods):
            if i < start:
                regressor[i] = 0
            elif i < start + ramp:
                # Ramp up phase
                regressor[i] = (i - start + 1) / ramp
            elif i < end:
                # Full effect phase
                regressor[i] = 1.0
            else:
                # Decay phase
                decay = min((i - end) / 12, 1.0)
                regressor[i] = 1 - decay * 0.4
        
        return regressor
    
    def _extend_scenario_regressor(self, future_df, params, total_periods, forecast_months):
        """
        Extend scenario regressor into forecast period.
        """
        duration = params.get('duration_months', 12)
        start = int(total_periods * 0.2)
        end = start + duration
        
        n_historical = total_periods
        n_total = len(future_df)
        
        regressor = np.zeros(n_total)
        
        # Fill historical portion
        regressor[:n_historical] = self._create_scenario_regressor(
            n_historical, params, total_periods
        )
        
        # Extend into forecast period
        for i in range(n_historical, n_total):
            if i < end:
                # Scenario still active
                regressor[i] = 1.0
            else:
                # Decay continues
                decay = min((i - end) / 12, 1.0)
                regressor[i] = max(0, 1 - decay * 0.6)  # Slightly faster decay in forecast
        
        return regressor
    
    def _generate_simple_forecast(self, simulated, params, months=12):
        """
        Fallback: Enhanced simple forecast with mean reversion and seasonality estimation.
        Used when Prophet is not available or fails.
        """
        forecast = {}
        
        for region, prices in simulated.items():
            prices_arr = np.array(prices)
            
            # Calculate statistics
            last_price = prices_arr[-1]
            mean_price = np.mean(prices_arr)
            std_price = np.std(prices_arr)
            
            # Calculate trend from last 6 months
            last_6 = prices_arr[-6:]
            trend = (last_6[-1] - last_6[0]) / 6 if len(last_6) > 1 else 0
            
            # Estimate simple seasonality
            seasonality = self._estimate_seasonality(prices_arr)
            
            # Generate forecast
            point_forecast = []
            lower_bound = []
            upper_bound = []
            
            current = last_price
            last_month_idx = len(prices_arr) % 12
            
            # Seed for reproducibility
            np.random.seed(42)
            
            for i in range(months):
                # Trend with decay
                trend_decay = 0.85 ** i
                trend_effect = trend * trend_decay
                
                # Mean reversion
                reversion = (mean_price - current) * 0.08
                
                # Seasonality
                season_idx = (last_month_idx + i) % 12
                seasonal = seasonality[season_idx] if seasonality is not None else 0
                
                # Combine effects
                current = current + trend_effect + reversion + seasonal
                
                # Add small noise
                noise = np.random.normal(0, std_price * 0.03)
                point = current + noise
                
                # Confidence intervals (widen over time)
                uncertainty = std_price * np.sqrt(i + 1) * 0.2
                
                point_forecast.append(round(point, 4))
                lower_bound.append(round(point - 1.96 * uncertainty, 4))
                upper_bound.append(round(point + 1.96 * uncertainty, 4))
            
            forecast[region] = {
                'point': point_forecast,
                'lower_95': lower_bound,
                'upper_95': upper_bound
            }
        
        # Generate forecast dates using proper month arithmetic
        last_date = datetime.strptime(self.dates[-1], '%Y-%m-%d')
        forecast['dates'] = [
            (last_date + relativedelta(months=i + 1)).strftime('%Y-%m-%d')
            for i in range(months)
        ]
        
        # Add metadata
        forecast['model'] = 'simple_fallback'
        forecast['confidence_interval'] = '95%'
        
        return forecast
    
    def _estimate_seasonality(self, prices, period=12):
        """
        Estimate seasonal pattern from price series.
        Returns array of 12 monthly adjustments.
        """
        if len(prices) < period * 2:
            return None
        
        try:
            # Reshape into complete years
            n_years = len(prices) // period
            truncated = prices[:n_years * period]
            yearly = truncated.reshape(n_years, period)
            
            # Average each month across years
            seasonal = np.mean(yearly, axis=0)
            
            # Convert to deviations from mean
            seasonal = seasonal - np.mean(seasonal)
            
            # Scale to be small adjustments
            seasonal = seasonal * 0.05
            
            return seasonal
        except Exception:
            return None
    
    # ==================== UTILITY METHODS ====================
    
    def get_forecast_components(self, scenario_id, custom_params=None):
        """
        Get detailed forecast components for visualization.
        Useful for debugging and advanced analysis.
        """
        if not PROPHET_AVAILABLE:
            return {"error": "Prophet not available"}
        
        result = self.apply_scenario(scenario_id, custom_params)
        simulated = result['simulated_prices']
        
        components = {}
        
        for region, prices in simulated.items():
            df = pd.DataFrame({
                'ds': pd.to_datetime(self.dates),
                'y': prices
            })
            
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False
            )
            model.fit(df)
            
            future = model.make_future_dataframe(periods=12, freq='MS')
            forecast = model.predict(future)
            
            components[region] = {
                'dates': forecast['ds'].dt.strftime('%Y-%m-%d').tolist(),
                'trend': forecast['trend'].tolist(),
                'yearly_seasonality': forecast['yearly'].tolist() if 'yearly' in forecast.columns else None,
                'yhat': forecast['yhat'].tolist(),
                'yhat_lower': forecast['yhat_lower'].tolist(),
                'yhat_upper': forecast['yhat_upper'].tolist()
            }
        
        return components
    
    def update_prophet_config(self, **kwargs):
        """
        Update Prophet configuration parameters.
        
        Example:
            engine.update_prophet_config(
                changepoint_prior_scale=0.1,
                seasonality_prior_scale=5
            )
        """
        valid_keys = self.prophet_config.keys()
        for key, value in kwargs.items():
            if key in valid_keys:
                self.prophet_config[key] = value
            else:
                print(f"Warning: Unknown config key '{key}'. Ignored.")


# Test
if __name__ == "__main__":
    engine = ScenarioEngine()
    
    print(f"Prophet available: {PROPHET_AVAILABLE}")
    print()
    
    print("=== Scenario 6: EU Regulatory ===")
    r1 = engine.apply_scenario(6)
    print(f"Default: EU = {r1['metrics']['eu_ech']['change_percent']}%")
    print(f"Forecast model: {r1['forecast'].get('model', 'unknown')}")
    print(f"Forecast dates: {r1['forecast']['dates'][:3]}")
    print(f"EU forecast (next 3 months): {r1['forecast']['eu_ech']['point'][:3]}")
    print(f"EU 95% CI: {r1['forecast']['eu_ech']['lower_95'][:3]} - {r1['forecast']['eu_ech']['upper_95'][:3]}")
    print()
    
    r2 = engine.apply_scenario(6, {'supply_reduction': 0.30, 'compliance_cost': 0.20})
    print(f"High impact: EU = {r2['metrics']['eu_ech']['change_percent']}%")
    print(f"EU forecast (next 3 months): {r2['forecast']['eu_ech']['point'][:3]}")
    print()
    
    r3 = engine.apply_scenario(6, {'supply_reduction': 0.05, 'compliance_cost': 0.02})
    print(f"Low impact: EU = {r3['metrics']['eu_ech']['change_percent']}%")
    print(f"EU forecast (next 3 months): {r3['forecast']['eu_ech']['point'][:3]}")
