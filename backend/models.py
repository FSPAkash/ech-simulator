"""
ECH Scenario Definitions
"""

MARKET_DATA = {
    'global_volume_2025': 2.2,      # Million tons
    'global_volume_2030': 2.59,     # Million tons
    'global_cagr': 0.033,           # 3.3% = (2.59/2.2)^(1/5) - 1
    'apac_demand_share': 0.59,      # 59% of global demand
    'epoxy_share': 0.86,            # 86% goes to epoxy
    'bio_based_cagr': 0.04,         # 4% growth for glycerine-based
    
    # Price ranges USD/ton (converted from USD/lb × 2204.62)
    'base_prices': {
        'us_ech': 1433,    # Mid of $0.53-0.77/lb
        'eu_ech': 2128,    # Mid of $0.87-1.06/lb
        'asia_ech': 1433,  # Mid of $0.59-0.71/lb
        'china_ech': 1092  # Mid of $0.40-0.59/lb
    }
}

# Scenario definitions
SCENARIOS = {
    1: {
        "id": 1,
        "name": "Global Demand Growth",
        "category": "demand",
        "description": "ECH market grows from 2.2M tons (2025) to 2.59M tons (2030) at 3.3% CAGR.",
        "affected_regions": ["all"],
        "parameters": {
            "demand_growth_rate": 0.033,
            "duration_months": 24,
            "price_elasticity": 0.6
        },
        "logic": "demand_growth",
        
        # Math documentation for info popup
        "math_info": {
            "title": "Global Demand Growth Model",
            "formula": "Price Change = Growth Rate × Duration (years) × Elasticity × Regional Weight",
            "parameters_explained": {
                "demand_growth_rate": {
                    "description": "Annual demand growth rate",
                    "default": "3.3% (market CAGR 2025-2030)",
                    "range": "0-10%",
                    "effect": "Higher growth → Higher prices"
                },
                "duration_months": {
                    "description": "How long the growth trend persists",
                    "default": "24 months",
                    "range": "6-48 months",
                    "effect": "Longer duration → Larger cumulative effect"
                },
                "price_elasticity": {
                    "description": "Price sensitivity to demand changes",
                    "default": "0.6 (inelastic)",
                    "range": "0.2-1.2",
                    "effect": "Higher elasticity → Larger price swings"
                }
            },
            "regional_weights": {
                "us_ech": "0.9 (less sensitive, stable market)",
                "eu_ech": "1.0 (baseline)",
                "asia_ech": "1.1 (larger, more reactive)",
                "china_ech": "1.15 (fastest growing)"
            },
            "example": "Default: 3.3% × 2 years × 0.6 × 1.0 = +3.96% price increase (EU)"
        }
    },
    
    2: {
        "id": 2,
        "name": "APAC Accelerated Growth",
        "category": "demand",
        "description": "APAC (59% of market) grows faster, pulling global prices up.",
        "affected_regions": ["asia", "china"],
        "parameters": {
            "apac_growth_premium": 0.02,
            "global_spillover": 0.3,
            "duration_months": 18
        },
        "logic": "apac_growth",
        
        "math_info": {
            "title": "APAC Growth Premium Model",
            "formula": "APAC Effect = Premium × Duration × 0.6\nGlobal Effect = APAC Effect × Spillover × 0.59",
            "parameters_explained": {
                "apac_growth_premium": {
                    "description": "Extra growth above global rate",
                    "default": "2% additional",
                    "range": "0-5%",
                    "effect": "Higher premium → APAC prices rise faster"
                },
                "global_spillover": {
                    "description": "How much APAC growth affects other regions",
                    "default": "30%",
                    "range": "0-60%",
                    "effect": "Higher spillover → More global impact"
                }
            },
            "regional_weights": {
                "asia_ech": "Direct effect (1.0×)",
                "china_ech": "Direct effect × 1.1",
                "us_ech": "Spillover only",
                "eu_ech": "Spillover × 1.1"
            },
            "example": "2% × 1.5yr × 0.6 = +1.8% APAC. Spillover: 1.8% × 0.3 × 0.59 = +0.32% US/EU"
        }
    },
    
    3: {
        "id": 3,
        "name": "Bio-based ECH Adoption",
        "category": "feedstock",
        "description": "Glycerine-based ECH grows at 4% CAGR, changing cost structures.",
        "affected_regions": ["asia", "eu"],
        "parameters": {
            "bio_adoption_rate": 0.04,
            "glycerine_cost_factor": 1.0,
            "duration_months": 36
        },
        "logic": "bio_adoption",
        
        "math_info": {
            "title": "Bio-based Adoption Model",
            "formula": "Bio Effect = Adoption Rate × Duration (years)\nRegional Impact varies by feedstock access",
            "parameters_explained": {
                "bio_adoption_rate": {
                    "description": "Annual growth of glycerine-based production",
                    "default": "4% (industry CAGR)",
                    "range": "0-8%",
                    "effect": "Higher adoption → Faster transition"
                },
                "glycerine_cost_factor": {
                    "description": "Relative glycerine cost (1.0 = normal)",
                    "default": "1.0",
                    "range": "0.5-2.0",
                    "effect": ">1: glycerine expensive, hurts EU\n<1: glycerine cheap, helps Asia"
                }
            },
            "regional_weights": {
                "eu_ech": "+8% per unit (poor glycerine access, regulations)",
                "asia_ech": "-5% per unit (good glycerine access)",
                "china_ech": "-6% per unit (best glycerine access)",
                "us_ech": "+2% per unit (propylene-based, minimal impact)"
            },
            "example": "4% × 3yr = 0.12 bio effect.\nEU: +0.12 × 8% = +0.96%\nChina: -0.12 × 6% = -0.72%"
        }
    },
    
    4: {
        "id": 4,
        "name": "Epoxy-Driven Demand",
        "category": "demand",
        "description": "86% of ECH goes to epoxy. Infrastructure/electronics surge drives prices.",
        "affected_regions": ["all"],
        "parameters": {
            "epoxy_demand_growth": 0.05,
            "infrastructure_boost": 0.0,
            "duration_months": 12
        },
        "logic": "epoxy_demand",
        
        "math_info": {
            "title": "Epoxy Demand Model",
            "formula": "Effect = (Epoxy Growth + Infra Boost) × 0.86 × Duration × 0.7",
            "parameters_explained": {
                "epoxy_demand_growth": {
                    "description": "Epoxy sector demand growth",
                    "default": "5%",
                    "range": "0-15%",
                    "effect": "Direct driver of ECH demand"
                },
                "infrastructure_boost": {
                    "description": "Additional infrastructure spending effect",
                    "default": "0%",
                    "range": "0-10%",
                    "effect": "Construction/wind energy boom adds demand"
                }
            },
            "regional_weights": {
                "china_ech": "1.15 (manufacturing hub)",
                "asia_ech": "1.1",
                "eu_ech": "1.0",
                "us_ech": "0.9"
            },
            "example": "5% × 0.86 × 1yr × 0.7 = +3.0% base effect"
        }
    },
    
    5: {
        "id": 5,
        "name": "Feedstock Route Shift",
        "category": "feedstock",
        "description": "Switching between glycerine and propylene routes changes costs.",
        "affected_regions": ["asia", "eu"],
        "parameters": {
            "glycerine_share_change": 0.1,
            "propylene_price_change": 0.0,
            "glycerine_price_change": 0.0,
            "duration_months": 24
        },
        "logic": "feedstock_shift",
        
        "math_info": {
            "title": "Feedstock Shift Model",
            "formula": "Effect = (Propylene × Weight) + (Glycerine × Weight) + (Shift × Direction)",
            "parameters_explained": {
                "glycerine_share_change": {
                    "description": "Shift toward (+) or away from (-) glycerine",
                    "default": "+10% shift to glycerine",
                    "range": "-20% to +30%",
                    "effect": "Positive: benefits Asia (cheap glycerine)\nNegative: benefits US/EU (propylene)"
                },
                "propylene_price_change": {
                    "description": "Change in propylene costs",
                    "default": "0%",
                    "range": "-20% to +30%",
                    "effect": "Mainly affects US/EU (propylene-based)"
                },
                "glycerine_price_change": {
                    "description": "Change in glycerine costs",
                    "default": "0%",
                    "range": "-20% to +30%",
                    "effect": "Mainly affects Asia (glycerine-based)"
                }
            },
            "regional_weights": {
                "us_ech": "40% propylene exposure, 2% glycerine",
                "eu_ech": "35% propylene, 15% glycerine",
                "asia_ech": "40% glycerine, minimal propylene",
                "china_ech": "45% glycerine, minimal propylene"
            },
            "example": "10% glycerine shift: Asia gets -4%, EU gets +5%"
        }
    },
    
    6: {
        "id": 6,
        "name": "EU Regulatory Impact",
        "category": "regulatory",
        "description": "EU deforestation regulations restrict glycerine supply, raising costs.",
        "affected_regions": ["eu"],
        "parameters": {
            "supply_reduction": 0.15,
            "compliance_cost": 0.10,
            "duration_months": 36
        },
        "logic": "eu_regulatory",
        
        "math_info": {
            "title": "EU Regulatory Impact Model",
            "formula": "EU Effect = (Supply Cut × 0.5 + Compliance Cost) × min(Duration, 2yr)\nOthers: Small competitive adjustment",
            "parameters_explained": {
                "supply_reduction": {
                    "description": "Glycerine supply reduction from regulations",
                    "default": "15%",
                    "range": "0-30%",
                    "effect": "Reduces EU feedstock access"
                },
                "compliance_cost": {
                    "description": "Additional costs for regulatory compliance",
                    "default": "10%",
                    "range": "0-25%",
                    "effect": "Direct cost addition to EU production"
                }
            },
            "regional_weights": {
                "eu_ech": "Full effect (supply + compliance)",
                "us_ech": "Minimal (+2% of supply cut)",
                "asia_ech": "Slight benefit (-2% competitive gain)",
                "china_ech": "Slight benefit (-3% competitive gain)"
            },
            "example": "15% supply cut + 10% compliance = (0.15×0.5 + 0.10) × 2 = +35% EU price increase over 2yr"
        }
    },
    
    7: {
        "id": 7,
        "name": "Asian Glycerine Advantage",
        "category": "feedstock",
        "description": "Lower glycerine costs give Asia price advantage.",
        "affected_regions": ["asia", "china"],
        "parameters": {
            "glycerine_cost_advantage": 0.15,
            "competitive_intensity": 0.5,
            "duration_months": 18
        },
        "logic": "asian_advantage",
        
        "math_info": {
            "title": "Asian Feedstock Advantage Model",
            "formula": "Asia Effect = -Cost Advantage × Intensity × min(Duration, 1.5yr)\nOthers: Competitive pressure = -Advantage × Intensity × 0.2-0.3",
            "parameters_explained": {
                "glycerine_cost_advantage": {
                    "description": "How much cheaper Asian glycerine is",
                    "default": "15%",
                    "range": "0-30%",
                    "effect": "Larger advantage → Lower Asian prices"
                },
                "competitive_intensity": {
                    "description": "How aggressively advantage is used",
                    "default": "50%",
                    "range": "20-100%",
                    "effect": "Higher intensity → More price undercutting"
                }
            },
            "regional_weights": {
                "asia_ech": "Full negative effect (price cut)",
                "china_ech": "1.1× effect (largest benefit)",
                "us_ech": "-30% of Asia effect (pressure)",
                "eu_ech": "-20% of Asia effect (less exposed)"
            },
            "example": "15% advantage × 50% intensity × 1.5yr = -11.25% Asia price"
        }
    },
    
    8: {
        "id": 8,
        "name": "Plant Shutdowns",
        "category": "supply",
        "description": "Capacity goes offline, causing regional supply shock.",
        "affected_regions": ["eu", "us"],
        "parameters": {
            "capacity_offline": 0.10,
            "region_affected": "eu",
            "duration_months": 6
        },
        "logic": "plant_shutdown",
        
        "math_info": {
            "title": "Supply Shock Model",
            "formula": "Direct Effect = Capacity Offline × Supply Elasticity (1.7)\nSpillover to other regions based on trade flows",
            "parameters_explained": {
                "capacity_offline": {
                    "description": "Percentage of regional capacity shut down",
                    "default": "10%",
                    "range": "2-25%",
                    "effect": "10% offline → ~17% price spike"
                },
                "region_affected": {
                    "description": "Which region has the shutdown",
                    "default": "EU",
                    "options": "EU, US, Asia, China",
                    "effect": "Affected region sees largest impact"
                }
            },
            "regional_weights": {
                "affected_region": "Full effect × duration factor",
                "neighboring": "20% spillover",
                "distant": "5-15% spillover"
            },
            "example": "10% EU offline: EU +17%, US +3.4%, Asia +2.5%"
        }
    },
    
    9: {
        "id": 9,
        "name": "Supply Chain Disruption",
        "category": "supply",
        "description": "Global logistics disruption affects all regions.",
        "affected_regions": ["all"],
        "parameters": {
            "disruption_severity": 0.20,
            "recovery_months": 4,
            "duration_months": 8
        },
        "logic": "supply_disruption",
        
        "math_info": {
            "title": "Global Disruption Model",
            "formula": "Peak Effect = Severity × 1.5\nAverage Effect = Peak × (1 - Recovery/2×Duration)",
            "parameters_explained": {
                "disruption_severity": {
                    "description": "How severe the disruption is",
                    "default": "20%",
                    "range": "5-40%",
                    "effect": "20% severity → 30% peak price spike"
                },
                "recovery_months": {
                    "description": "Time to recover from disruption",
                    "default": "4 months",
                    "range": "1-12 months",
                    "effect": "Faster recovery → Lower average effect"
                }
            },
            "regional_weights": {
                "eu_ech": "1.0 (most trade-dependent)",
                "asia_ech": "0.9",
                "china_ech": "0.85",
                "us_ech": "0.8 (most self-sufficient)"
            },
            "example": "20% severity, 4mo recovery, 8mo duration:\nPeak: 30%, Avg: 30% × (1 - 4/16) = 22.5%"
        }
    },
    
    10: {
        "id": 10,
        "name": "Capacity Expansion",
        "category": "supply",
        "description": "New capacity creates oversupply, pushing prices down.",
        "affected_regions": ["asia", "china"],
        "parameters": {
            "capacity_addition": 0.15,
            "ramp_up_months": 6,
            "duration_months": 24
        },
        "logic": "capacity_expansion",
        
        "math_info": {
            "title": "Capacity Expansion Model",
            "formula": "Effect = -Capacity Addition × 0.8 × (1 - Ramp-up/2×Duration)",
            "parameters_explained": {
                "capacity_addition": {
                    "description": "New capacity as % of current",
                    "default": "15%",
                    "range": "5-30%",
                    "effect": "15% new capacity → ~12% price drop"
                },
                "ramp_up_months": {
                    "description": "Time for new plants to reach full output",
                    "default": "6 months",
                    "range": "3-12 months",
                    "effect": "Longer ramp-up → Delayed price impact"
                }
            },
            "regional_weights": {
                "asia_ech": "1.0 (where expansion happens)",
                "china_ech": "1.1 (largest additions)",
                "eu_ech": "0.5 (import competition)",
                "us_ech": "0.4 (least affected)"
            },
            "example": "15% addition × 0.8 × (1 - 6/48) = -10.5% Asia price"
        }
    },
    
    11: {
        "id": 11,
        "name": "Americas Market Stability",
        "category": "regional",
        "description": "US market isolated from global volatility.",
        "affected_regions": ["us"],
        "parameters": {
            "isolation_factor": 0.7,
            "competitive_pressure": 0.0,
            "duration_months": 24
        },
        "logic": "americas_stability",
        
        "math_info": {
            "title": "Americas Stability Model",
            "formula": "US Effect = -Competitive Pressure × 0.5\nOthers: Drift = Base Rate × (1 - Isolation)",
            "parameters_explained": {
                "isolation_factor": {
                    "description": "How isolated US is from global swings",
                    "default": "70%",
                    "range": "30-90%",
                    "effect": "Higher isolation → Less global correlation"
                },
                "competitive_pressure": {
                    "description": "Import competition pressure",
                    "default": "0%",
                    "range": "0-20%",
                    "effect": "Higher pressure → Lower US prices"
                }
            },
            "regional_weights": {
                "us_ech": "Stable (pressure effect only)",
                "others": "Small drift based on isolation"
            },
            "example": "70% isolation: Other regions drift ±1-3% while US stays flat"
        }
    },
    
    12: {
        "id": 12,
        "name": "Europe Price Elevation",
        "category": "regional",
        "description": "EU capacity cuts (e.g., Inovyn) raise regional prices.",
        "affected_regions": ["eu"],
        "parameters": {
            "capacity_reduction": 0.12,
            "import_dependency": 0.2,
            "duration_months": 18
        },
        "logic": "europe_elevation",
        
        "math_info": {
            "title": "EU Price Elevation Model",
            "formula": "EU Effect = (Capacity Cut × 1.5 + Import Dependency × 0.3) × Duration Factor",
            "parameters_explained": {
                "capacity_reduction": {
                    "description": "EU capacity taken offline",
                    "default": "12%",
                    "range": "0-25%",
                    "effect": "12% cut → ~18% price increase"
                },
                "import_dependency": {
                    "description": "Increased reliance on imports",
                    "default": "20%",
                    "range": "0-40%",
                    "effect": "Higher imports → Higher transport costs"
                }
            },
            "regional_weights": {
                "eu_ech": "Full effect",
                "us_ech": "10% of capacity cut (slight benefit)",
                "asia_ech": "-5% (gains EU market share)",
                "china_ech": "-5% (gains EU market share)"
            },
            "example": "12% cut + 20% imports = (0.12×1.5 + 0.2×0.3) × 1.5yr = +27% EU"
        }
    },
    
    13: {
        "id": 13,
        "name": "APAC Price Pressure",
        "category": "regional",
        "description": "Asian prices rise from feedstock costs and shutdowns.",
        "affected_regions": ["asia", "china"],
        "parameters": {
            "feedstock_pressure": 0.08,
            "shutdown_impact": 0.05,
            "duration_months": 12
        },
        "logic": "apac_pressure",
        
        "math_info": {
            "title": "APAC Pressure Model",
            "formula": "APAC Effect = (Feedstock Pressure + Shutdown × 1.5) × Duration Factor",
            "parameters_explained": {
                "feedstock_pressure": {
                    "description": "Glycerine cost increase in Asia",
                    "default": "8%",
                    "range": "0-20%",
                    "effect": "Direct cost pass-through"
                },
                "shutdown_impact": {
                    "description": "Asian capacity offline",
                    "default": "5%",
                    "range": "0-15%",
                    "effect": "Supply reduction multiplied by 1.5"
                }
            },
            "regional_weights": {
                "asia_ech": "1.0 (full effect)",
                "china_ech": "1.1",
                "eu_ech": "0.2 (minor spillover)",
                "us_ech": "0.15"
            },
            "example": "8% feedstock + 5%×1.5 shutdown = 15.5% APAC increase"
        }
    },
    
    14: {
        "id": 14,
        "name": "Asian Price Undercutting",
        "category": "competitive",
        "description": "Asian producers use cost advantage for aggressive pricing.",
        "affected_regions": ["asia", "china"],
        "parameters": {
            "price_discount": 0.10,
            "market_share_target": 0.05,
            "duration_months": 18
        },
        "logic": "asian_undercut",
        
        "math_info": {
            "title": "Asian Undercutting Model",
            "formula": "Asia Cut = -Discount × Duration Factor\nCompetitive Pressure = Discount × Share Target × 5",
            "parameters_explained": {
                "price_discount": {
                    "description": "How much Asia undercuts market price",
                    "default": "10%",
                    "range": "2-20%",
                    "effect": "Direct price reduction in Asia"
                },
                "market_share_target": {
                    "description": "Market share Asia wants to gain",
                    "default": "5%",
                    "range": "0-15%",
                    "effect": "Higher ambition → More pressure on others"
                }
            },
            "regional_weights": {
                "asia_ech": "-1.0× discount",
                "china_ech": "-1.1× discount",
                "us_ech": "-0.6× competitive pressure",
                "eu_ech": "-0.5× competitive pressure"
            },
            "example": "10% discount, 5% share target:\nAsia: -15%, Pressure: 10%×5%×5 = 2.5%\nUS: -2.5%×0.6 = -1.5%"
        }
    },
    
    15: {
        "id": 15,
        "name": "EU Supply Constraints",
        "category": "competitive",
        "description": "EU producers face constraints, allowing price increases.",
        "affected_regions": ["eu"],
        "parameters": {
            "supply_constraint": 0.15,
            "pricing_power": 0.8,
            "duration_months": 24
        },
        "logic": "eu_constraints",
        
        "math_info": {
            "title": "EU Constraints Model",
            "formula": "EU Effect = Constraint × Pricing Power × Duration Factor",
            "parameters_explained": {
                "supply_constraint": {
                    "description": "How constrained EU supply is",
                    "default": "15%",
                    "range": "5-30%",
                    "effect": "Tighter supply → More pricing power"
                },
                "pricing_power": {
                    "description": "Ability to pass costs to customers",
                    "default": "80%",
                    "range": "30-100%",
                    "effect": "Higher power → Larger price increase"
                }
            },
            "regional_weights": {
                "eu_ech": "Full effect",
                "us_ech": "5% of constraint (slight increase)",
                "asia_ech": "-3% (competitive opportunity)",
                "china_ech": "-4% (competitive opportunity)"
            },
            "example": "15% constraint × 80% power × 2yr = +24% EU"
        }
    },
    
    16: {
        "id": 16,
        "name": "US Stable Production",
        "category": "competitive",
        "description": "US producers maintain steady output and predictable pricing.",
        "affected_regions": ["us"],
        "parameters": {
            "output_stability": 0.95,
            "price_volatility_reduction": 0.3,
            "duration_months": 36
        },
        "logic": "us_stable",
        
        "math_info": {
            "title": "US Stability Model",
            "formula": "US Effect = 0 (stable)\nOthers: Minor drift based on global factors",
            "parameters_explained": {
                "output_stability": {
                    "description": "Capacity utilization rate",
                    "default": "95%",
                    "range": "70-100%",
                    "effect": "Higher stability → More predictable prices"
                },
                "price_volatility_reduction": {
                    "description": "Reduction in price swings",
                    "default": "30%",
                    "range": "0-60%",
                    "effect": "Reduces simulation noise for US"
                }
            },
            "regional_weights": {
                "us_ech": "0% (anchor)",
                "eu_ech": "+1% drift",
                "asia_ech": "+1.5% drift",
                "china_ech": "+2% drift"
            },
            "example": "US stays flat while others drift 1-2%"
        }
    }
}


def get_scenario(scenario_id):
    return SCENARIOS.get(scenario_id)


def get_all_scenarios():
    return list(SCENARIOS.values())


def get_scenarios_by_category(category):
    return [s for s in SCENARIOS.values() if s["category"] == category]


def get_market_data():
    return MARKET_DATA