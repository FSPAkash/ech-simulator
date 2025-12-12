"""
Flask Backend API for ECH Price Simulator
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os

from models import get_scenario, get_all_scenarios, get_scenarios_by_category
from scenario_engine import ScenarioEngine
from data_generator import ECHDataGenerator

# Get the directory where app.py is located
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_BUILD_DIR = os.path.join(BACKEND_DIR, '..', 'frontend', 'build')
DATA_PATH = os.path.join(BACKEND_DIR, 'data', 'synthetic_data.json')

app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path='')
CORS(app)

# Generate data if not exists
if not os.path.exists(DATA_PATH):
    os.makedirs(os.path.join(BACKEND_DIR, 'data'), exist_ok=True)
    generator = ECHDataGenerator()
    generator.save_data(DATA_PATH)

engine = ScenarioEngine(DATA_PATH)


# ============== API ROUTES ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'ECH Simulator API is running'
    })


@app.route('/api/scenarios', methods=['GET'])
def list_scenarios():
    """Get all available scenarios"""
    category = request.args.get('category')

    if category:
        scenarios = get_scenarios_by_category(category)
    else:
        scenarios = get_all_scenarios()

    return jsonify({
        'count': len(scenarios),
        'scenarios': scenarios
    })


@app.route('/api/scenarios/<int:scenario_id>', methods=['GET'])
def get_scenario_detail(scenario_id):
    """Get detailed information about a specific scenario"""
    scenario = get_scenario(scenario_id)

    if not scenario:
        return jsonify({'error': f'Scenario {scenario_id} not found'}), 404

    return jsonify(scenario)


@app.route('/api/simulate/<int:scenario_id>', methods=['POST'])
def simulate_scenario(scenario_id):
    """
    Run simulation for a specific scenario

    Optional body parameters:
    - custom_params: Dict of custom parameter overrides
    """
    custom_params = None

    if request.is_json:
        data = request.get_json()
        custom_params = data.get('custom_params')

    try:
        result = engine.apply_scenario(scenario_id, custom_params)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Simulation error: {str(e)}'}), 500


@app.route('/api/compare', methods=['POST'])
def compare_scenarios():
    """
    Compare multiple scenarios

    Body parameters:
    - scenario_ids: List of scenario IDs to compare
    """
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    scenario_ids = data.get('scenario_ids', [])

    if not scenario_ids:
        return jsonify({'error': 'scenario_ids is required'}), 400

    if len(scenario_ids) > 5:
        return jsonify({'error': 'Maximum 5 scenarios for comparison'}), 400

    try:
        result = engine.compare_scenarios(scenario_ids)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Comparison error: {str(e)}'}), 500


@app.route('/api/sensitivity', methods=['POST'])
def sensitivity_analysis():
    """
    Run sensitivity analysis

    Body parameters:
    - scenario_id: Base scenario ID
    - parameter: Parameter name to vary
    - values: List of values to test
    """
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    scenario_id = data.get('scenario_id')
    parameter = data.get('parameter')
    values = data.get('values')

    if not all([scenario_id, parameter, values]):
        return jsonify({'error': 'scenario_id, parameter, and values are required'}), 400

    try:
        result = engine.sensitivity_analysis(scenario_id, parameter, values)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Analysis error: {str(e)}'}), 500


@app.route('/api/baseline', methods=['GET'])
def get_baseline_data():
    """Get baseline (historical) data"""
    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Error loading data: {str(e)}'}), 500


@app.route('/api/prices', methods=['GET'])
def get_prices():
    """Get price data with optional filtering"""
    region = request.args.get('region')
    price_type = request.args.get('type')

    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)

        prices = data['prices']
        dates = data['dates']

        if region and price_type:
            key = f"{region}_{price_type}"
            if key in prices:
                return jsonify({
                    'dates': dates,
                    'prices': {key: prices[key]}
                })
        elif region:
            filtered = {k: v for k, v in prices.items() if region in k}
            return jsonify({
                'dates': dates,
                'prices': filtered
            })
        elif price_type:
            filtered = {k: v for k, v in prices.items() if price_type in k}
            return jsonify({
                'dates': dates,
                'prices': filtered
            })

        return jsonify({
            'dates': dates,
            'prices': prices
        })

    except Exception as e:
        return jsonify({'error': f'Error loading prices: {str(e)}'}), 500


@app.route('/api/capacity', methods=['GET'])
def get_capacity():
    """Get plant capacity data"""
    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)
        return jsonify({
            'dates': data['dates'],
            'capacity': data['capacity']
        })
    except Exception as e:
        return jsonify({'error': f'Error loading capacity: {str(e)}'}), 500


@app.route('/api/outages', methods=['GET'])
def get_outages():
    """Get outage history"""
    region = request.args.get('region')

    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)

        outages = data['outages']

        if region:
            outages = [o for o in outages if o['region'].lower() == region.lower()]

        return jsonify({
            'count': len(outages),
            'outages': outages
        })
    except Exception as e:
        return jsonify({'error': f'Error loading outages: {str(e)}'}), 500


@app.route('/api/trade', methods=['GET'])
def get_trade_prices():
    """Get trade price data (HS 2921.12)"""
    try:
        with open(DATA_PATH, 'r') as f:
            data = json.load(f)
        return jsonify({
            'dates': data['dates'],
            'trade_prices': data['trade_prices']
        })
    except Exception as e:
        return jsonify({'error': f'Error loading trade prices: {str(e)}'}), 500


@app.route('/api/regenerate', methods=['POST'])
def regenerate_data():
    """Regenerate synthetic data"""
    try:
        params = {}
        if request.is_json:
            data = request.get_json()
            params['start_date'] = data.get('start_date', '2020-01-01')
            params['periods'] = data.get('periods', 60)

        generator = ECHDataGenerator(**params)
        generator.save_data(DATA_PATH)

        global engine
        engine = ScenarioEngine(DATA_PATH)

        return jsonify({
            'status': 'success',
            'message': 'Data regenerated successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Regeneration error: {str(e)}'}), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all scenario categories"""
    scenarios = get_all_scenarios()
    categories = list(set(s['category'] for s in scenarios))

    category_counts = {}
    for cat in categories:
        category_counts[cat] = len([s for s in scenarios if s['category'] == cat])

    return jsonify({
        'categories': categories,
        'counts': category_counts
    })


# ============== SERVE REACT FRONTEND ==============

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React frontend for all non-API routes"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Endpoint not found'}), 404
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)