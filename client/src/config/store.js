// Configuracion central de la tienda. Unica fuente de verdad para datos del
// negocio: nombre, contacto, horarios, redes, links. Si hay que cambiar algo
// se cambia ACA y se refleja en Header y Footer.

const storeConfig = {
  name: 'FiguraAR',
  tagline: 'Figuras de colección que puedes ver en tu espacio antes de comprar.',

  contact: {
    address: 'Francisco Motta Alberti 340, Coquimbo',
    phone: '+56 9 0000 0000',
    email: 'contacto@figura-ar.cl',
    // Formato internacional sin + ni espacios para wa.me/56XXXXXXXXX
    whatsappNumber: '56900000000'
  },

  // Horarios de despacho/atencion. Solo texto en el Footer. La logica de
  // abierto/cerrado vive en useStoreOpenStatus (hardcodeada). Si cambian los
  // horarios hay que tocar los dos lugares.
  hours: [
    { days: 'Lun - Vie', time: '09:00 a 19:00' },
    { days: 'Sáb', time: '10:00 a 14:00' }
  ],

  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    tiktok: 'https://www.tiktok.com/'
  },

  links: {
    logo: null,
    // Iframe de Google Maps embebido para el Footer (direccion de Coquimbo).
    mapEmbed: 'https://www.google.com/maps?q=Francisco+Motta+Alberti+340,+Coquimbo&output=embed'
  }
}

export default storeConfig
