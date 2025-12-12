"""
Synthetic Data Generator - Based on Real ECH Price Ranges
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

class ECHDataGenerator:
    def __init__(self, start_date="2020-01-01", periods=60):
        self.start_date = pd.to_datetime(start_date)
        self.periods = periods
        self.dates = pd.date_range(start=self.start_date, periods=periods, freq='M')
        
        # Real price ranges (USD/lb) from market data
        # China: $0.40-0.59/lb
        # Europe: $0.87-1.06/lb  
        # Americas: $0.53-0.77/lb
        # Asia: $0.59-0.71/lb
        
        self.price_config = {
            'us_ech': {'base': 0.65, 'range': 0.12, 'volatility': 0.03},
            'eu_ech': {'base': 0.96, 'range': 0.10, 'volatility': 0.04},
            'asia_ech': {'base': 0.65, 'range': 0.06, 'volatility': 0.035},
            'china_ech': {'base': 0.50, 'range': 0.10, 'volatility': 0.04},
            'glycerin': {'base': 0.36, 'range': 0.07, 'volatility': 0.06},
            'propylene': {'base': 0.45, 'range': 0.09, 'volatility': 0.05}
        }
    
    def generate_price_series(self, config):
        """Generate realistic price series"""
        np.random.seed(42)
        
        base = config['base']
        range_val = config['range']
        vol = config['volatility']
        
        # Start at base
        prices = [base]
        
        for i in range(1, self.periods):
            # Random walk with mean reversion
            change = np.random.normal(0, base * vol)
            reversion = (base - prices[-1]) * 0.05
            seasonal = range_val * 0.3 * np.sin(2 * np.pi * i / 12)
            
            new_price = prices[-1] + change + reversion + seasonal
            
            # Keep in realistic range
            new_price = max(base - range_val, min(base + range_val, new_price))
            prices.append(round(new_price, 4))
        
        return prices
    
    def generate_all_data(self):
        """Generate complete dataset"""
        data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'start_date': self.start_date.strftime('%Y-%m-%d'),
                'periods': self.periods,
                'unit': 'USD/lb',
                'note': 'Prices in USD/lb based on real market ranges'
            },
            'dates': [d.strftime('%Y-%m-%d') for d in self.dates],
            'prices': {}
        }
        
        for name, config in self.price_config.items():
            data['prices'][name] = self.generate_price_series(config)
        
        return data
    
    def save_data(self, filepath='data/synthetic_data.json'):
        """Save to file"""
        data = self.generate_all_data()
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to {filepath}")
        return data


if __name__ == "__main__":
    gen = ECHDataGenerator()
    gen.save_data()