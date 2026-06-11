import { useRef } from "react";
import { useParams } from "react-router";
import { useProducts } from "../hooks/useProducts";

// Pagina AR directa via QR: imprimes un QR por figura, el cliente lo escanea
// y abre directo el modelo en AR full-screen. Aislada del resto del catalogo.
function DirectARViewer() {
  const { products, loading } = useProducts();
  const { productId } = useParams();
  const product = products.find((p) => p.id === productId);

  const modelViewerRef = useRef(null);

  const launchAr = () => {
    if (modelViewerRef.current) modelViewerRef.current.activateAR();
  };

  if (loading) return <div style={S.center}>Cargando experiencia AR…</div>;
  if (!product || !product.model) return <div style={S.center}>Figura no encontrada</div>;

  return (
    <div style={S.fullScreen}>
      <model-viewer
        ref={modelViewerRef}
        src={product.model}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={S.viewer}
      >
        <button slot="ar-button" style={S.arButton} onClick={launchAr}>
          Ver en mi espacio
        </button>
      </model-viewer>
    </div>
  );
}

const S = {
  fullScreen: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
    display: "flex",
    flexDirection: "column",
  },
  viewer: { width: "100%", height: "100%" },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  arButton: {
    position: "absolute",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "15px 30px",
    background: "linear-gradient(135deg, #ff6a00, #ff4747)",
    color: "white",
    border: "none",
    borderRadius: "25px",
    fontSize: "18px",
    fontWeight: "bold",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.5)",
    cursor: "pointer",
    zIndex: 10,
  },
};

export default DirectARViewer;
