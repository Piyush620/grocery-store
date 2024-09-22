from flask import Flask,request,jsonify
import product_dao
from sql_connection import get_sql_connection


app = Flask(__name__)
connection = get_sql_connection()
@app.route('/getProducts',methods =['GET'])
def get_products():
    products = product_dao.get_all_products(connection)
    response = jsonify(products)
    response.headers.add('Access-Control-Allow-origin','*')
    return response 

if __name__ =="__main__":
    print("Starting Python Flask Server For Grocery Store Mangement System")
    app.run(port=5000)