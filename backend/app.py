import pymysql
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, origins=["http://localhost:5173"])


def get_db_connection():
    return pymysql.connect(
        host=app.config["MYSQL_HOST"],
        user=app.config["MYSQL_USER"],
        password=app.config["MYSQL_PASSWORD"],
        database=app.config["MYSQL_DATABASE"],
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
    )


@app.get("/api/health")
def health_check():
    try:
        connection = get_db_connection()
        connection.close()

        return jsonify({
            "status": "ok",
            "database": "connected"
        }), 200

    except pymysql.MySQLError:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "message": "Database unavailable"
        }), 503


if __name__ == "__main__":
    app.run(debug=False, port=5000)