from flask import Flask, request, jsonify
from flask_cors import CORS
import product_dao
from sql_connection import get_sql_connection

app = Flask(__name__)
CORS(app)  # Add CORS support

connection = get_sql_connection()

@app.route('/getProducts', methods=['GET'])
def get_products():
    products = product_dao.get_all_products(connection)
    return jsonify(products)

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)
