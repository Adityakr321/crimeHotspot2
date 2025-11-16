import pandas as pd
from flask import Flask, jsonify
from sqlalchemy import create_engine
from flask_cors import CORS
import geopandas as gpd
from sqlalchemy import text

#################################################
# Database Setup
#################################################

# Set up connection with the SQLite server
engine = create_engine("sqlite:///LA_Crime_Data.sqlite")

# Use FULL dataset (uncomment this, comment the sample)
df = pd.read_csv('data/DataCleaned.csv')  # FULL DATASET
df.to_sql('LA_Crime_Data', con=engine, if_exists='replace', index=False)

# Use sample dataset instead (50,000 records) - COMMENT THIS OUT
# df = pd.read_csv('data/DataSample.csv')
# df.to_sql('LA_Crime_Data', con=engine, if_exists='replace', index=False)

#################################################
# Flask Setup
#################################################
app = Flask(__name__)
CORS(app)  # Allow all origins for local development

#################################################
# Flask Routes
#################################################

@app.route("/")
def welcome():
    return "Welcome! This is the LA Crime Data Dashboard API homepage."

# This route performs a get all query on the database.
@app.route("/crimedata")
def locations():
    with engine.connect() as conn:
        # REMOVED LIMIT for full dataset
        result = conn.execute(text('SELECT * FROM LA_Crime_Data'))
        data = [row._asdict() for row in result]
    return jsonify(data)

# This route is used to perform queries based on a user input.
@app.route("/crimedata/<thing>")
def assault(thing):
    upper = thing.upper()
    with engine.connect() as conn:
        # REMOVED LIMIT for full dataset
        result = conn.execute(text(f"SELECT * FROM LA_Crime_Data WHERE [Crm Cd Desc] LIKE '%{upper}%'"))
        data = [row._asdict() for row in result]
    return jsonify(data)

# This route gets all crimes not specified by the "thing" route.
@app.route("/crimedata/other/all")
def other():
    with engine.connect() as conn:
        # REMOVED LIMIT for full dataset
        result = conn.execute(text(f"SELECT * FROM LA_Crime_Data WHERE [Crm Cd Desc] NOT LIKE '%ASSAULT%'\
                                AND [Crm Cd Desc] NOT LIKE '%ARSON%'\
                                AND [Crm Cd Desc] NOT LIKE '%BATTERY%'\
                                AND [Crm Cd Desc] NOT LIKE '%BIKE%'\
                                AND [Crm Cd Desc] NOT LIKE '%BOMB%'\
                                AND [Crm Cd Desc] NOT LIKE '%BUNCO%'\
                                AND [Crm Cd Desc] NOT LIKE '%BURGLARY%'\
                                AND [Crm Cd Desc] NOT LIKE '%COUNTERFEIT%'\
                                AND [Crm Cd Desc] NOT LIKE '%CREDIT CARD%'\
                                AND [Crm Cd Desc] NOT LIKE '%CRIMINAL HOMICIDE%'\
                                AND [Crm Cd Desc] NOT LIKE '%DISTURBING THE PEACE%'\
                                AND [Crm Cd Desc] NOT LIKE '%FORGERY%'\
                                AND [Crm Cd Desc] NOT LIKE '%EMBEZZLEMENT%'\
                                AND [Crm Cd Desc] NOT LIKE '%EXTORTION%'\
                                AND [Crm Cd Desc] NOT LIKE '%HUMAN TRAFFICKING%'\
                                AND [Crm Cd Desc] NOT LIKE '%INDECENT EXPOSURE%'\
                                AND [Crm Cd Desc] NOT LIKE '%KIDNAPPING%'\
                                AND [Crm Cd Desc] NOT LIKE '%LEWD%'\
                                AND [Crm Cd Desc] NOT LIKE '%PICKPOCKET%'\
                                AND [Crm Cd Desc] NOT LIKE '%ROBBERY%'\
                                AND [Crm Cd Desc] NOT LIKE '%SHOPLIFTING%'\
                                AND [Crm Cd Desc] NOT LIKE '%SEX%'\
                                AND [Crm Cd Desc] NOT LIKE '%STALKING%'\
                                AND [Crm Cd Desc] NOT LIKE '%THEFT%'\
                                AND [Crm Cd Desc] NOT LIKE '%TRESPASSING%'\
                                AND [Crm Cd Desc] NOT LIKE '%VANDALISM%'\
                                AND [Crm Cd Desc] NOT LIKE '%VEHICLE%'"))
        data = [row._asdict() for row in result]
    return jsonify(data)

# This route calls an API to get Lat and Long data from a GEOJSON
@app.route("/stations")
def stations():
    gdf = gpd.read_file('data/LAPD_Police_Stations.geojson')
    new_geojson_dict = {
        "type": "FeatureCollection",
        "features": []
    }
    for index, row in gdf.iterrows():
        feature = {
            "type": "Feature",
            "geometry": row.geometry.__geo_interface__,
            "properties": row.drop('geometry').to_dict()
        }
        new_geojson_dict["features"].append(feature)
    return (new_geojson_dict)

# This route calls an API to get Lat and Long data from a GEOJSON for the purpose of drawing boundaries.
@app.route("/cityareas")
def cityareas():
    gdf2 = gpd.read_file('data/Neighborhood_Service_Areas.geojson')
    new_geojson_dict2 = {
        "type": "FeatureCollection",
        "features": []
    }
    for index, row in gdf2.iterrows():
        feature = {
            "type": "Feature",
            "geometry": row.geometry.__geo_interface__,
            "properties": row.drop('geometry').to_dict()
        }
        new_geojson_dict2["features"].append(feature)
    return (new_geojson_dict2)

# Boilerplate
if __name__ == '__main__':
    app.run(debug=True, port=5000)