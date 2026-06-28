// Configuracion central de la tienda. Unica fuente de verdad para datos del
// negocio: nombre, contacto, horarios, redes, links.

const storeConfig = {
  name: 'HublabExpress',
  tagline: 'Productos que puedes ver en tu espacio antes de comprar, con Realidad Aumentada.',

  contact: {
    address: 'Francisco Motta Alberti 340, Coquimbo',
    phone: '+56 9 0000 0000',
    email: 'contacto@hublabexpress.cl',
    // Formato internacional sin + ni espacios para wa.me/56XXXXXXXXX
    whatsappNumber: '56900000000'
  },

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
    mapEmbed: 'https://www.google.com/maps?q=Francisco+Motta+Alberti+340,+Coquimbo&output=embed'
  }
}

export default storeConfig
