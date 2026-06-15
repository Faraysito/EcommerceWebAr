""" Algoritmo de machine learning sencillo que entrega los n productos más similares al producto seleccionado
"""

import pandas as pd
from difflib import SequenceMatcher
from sqlalchemy import create_engine

# la direccion actual no funciona, el servidor no se ejecuta
engine = create_engine("postgresql://postgres.lwkikmipbbrhgypyqcqy:[YOUR-PASSWORD]]@aws-1-us-east-2.pooler.supabase.com:5432/postgres")

""" 
Recibe parámetros de producto y cantidad de elementos a devolver
"""
def recursos_similares(id, k):
    # data frame
    dc_listing = pd.read_sql("SELECT id, name, category_id, price FROM product", engine)

    temp_df = dc_listing.copy()

    # producto seleccionado
    producto = pd.read_sql("SELECT id, name, category_id, price FROM product WHERE id = %(id)s", engine, params={"id": id}).iloc[0]

    """
    Calcula la similitud entre el producto seleccionado y los elementos utilizando columnas
    price, name y category_id
    """
    # similitud precios (40% de peso)
    temp_df['price_similarity'] = temp_df['price'].apply(lambda x: similitud_precio(x, producto.price) *0.4)
    # similitud nombres (40% de peso)
    temp_df['name_similarity'] = temp_df['name'].apply(lambda x: SequenceMatcher(None, producto["name"].lower(), x.lower()).ratio() *0.4)
    # similitud categoria (20% de peso)
    temp_df['category_similarity'] = temp_df['category_id'].apply(lambda x: (1 if x == producto.category_id else 0) *0.2)

    temp_df['similarity_score'] = temp_df['price_similarity'] + temp_df['name_similarity'] + temp_df['category_similarity']
    
    temp_df = temp_df[temp_df['id'] != producto.id]

    temp_df = temp_df.sort_values('similarity_score', ascending=False)

    return temp_df.head(k)

def similitud_precio(p1, p2):
    diferencia = abs(p1 - p2)
    return 1 / (1 + (diferencia / 100)**2)

print(recursos_similares("0ec1ca7c-6a7a-4d99-b2b6-b11052e521ba", 8))