""" K-NEAREST NEIGTHBORS: 
Entrega una lista de los 5 productos más similares al producto seleccionado
"""

import numpy as np
import pandas as pd
from difflib import SequenceMatcher
from sqlalchemy import create_engine

#engine = create_engine("postgresql://postgres:NorthumbriaBernard1998.@db.vjseeipqkgqgdtxxkcdv.supabase.co:5432/postgres")
# from envSchema import product, sale, customer, category

dc_listing = pd.read_sql("SELECT id, name, category_id, price FROM product", engine)

def cincoProductosSimilares(dc_listing, new_price):
    temp_df = dc_listing.copy()
    temp_df['distance'] = (temp_df['price'] - new_price).abs()
    temp_df = temp_df.sort_values(by = 'distance')

    return temp_df.head(5)

def similitud_nombre(, nombre1, nombre2)

print(cincoProductosSimilares(dc_listing, 5000))