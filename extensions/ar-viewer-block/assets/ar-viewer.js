/*
 * Visor AR (AR Viewer) — lógica del app block.
 *
 * Por cada bloque en la página: lee shop + product_id de los data-attrs,
 * consulta el backend, y si el producto tiene modelo asignado, monta un
 * <model-viewer> con botón AR. Si no, oculta el bloque.
 */
;(function () {
  function initBlock(block) {
    var endpoint = block.getAttribute('data-ar-endpoint')
    var shop = block.getAttribute('data-shop')
    var productId = block.getAttribute('data-product-id')

    var statusEl = block.querySelector('[data-ar-status]')
    var mountEl = block.querySelector('[data-ar-mount]')

    if (!endpoint || !shop || !productId) {
      block.style.display = 'none'
      return
    }

    var url =
      endpoint +
      '?shop=' +
      encodeURIComponent(shop) +
      '&product_id=' +
      encodeURIComponent(productId)

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then(function (data) {
        if (!data || !data.hasModel || !data.modelUrl) {
          // Este producto no tiene modelo AR: ocultamos el bloque entero.
          block.style.display = 'none'
          return
        }
        mountViewer(block, statusEl, mountEl, data)
      })
      .catch(function () {
        // Ante cualquier error, no rompemos la página del producto.
        block.style.display = 'none'
      })
  }

  function mountViewer(block, statusEl, mountEl, data) {
    var mv = document.createElement('model-viewer')
    mv.setAttribute('src', data.modelUrl)
    mv.setAttribute('ar', '')
    mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
    mv.setAttribute('camera-controls', '')
    mv.setAttribute('shadow-intensity', '1')
    mv.setAttribute('alt', data.name || 'Modelo 3D del producto')
    mv.style.width = '100%'
    mv.style.height = '420px'
    mv.style.backgroundColor = '#f5f5f5'

    // Escala real si hay medidas (model-viewer usa metros; cm/100).
    if (data.widthCm || data.heightCm || data.depthCm) {
      var w = (data.widthCm || 0) / 100
      var h = (data.heightCm || 0) / 100
      var d = (data.depthCm || 0) / 100
      if (w && h && d) {
        mv.setAttribute('scale', w + ' ' + h + ' ' + d)
      }
    }

    // Botón AR personalizado.
    var btnText =
      block.getAttribute('data-ar-button') ||
      (block.querySelector('[data-ar-button-text]') || {}).textContent ||
      'Ver en tu espacio'
    var btn = document.createElement('button')
    btn.setAttribute('slot', 'ar-button')
    btn.textContent = btnText
    btn.style.cssText =
      'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);' +
      'padding:10px 18px;border:none;border-radius:24px;background:#111;' +
      'color:#fff;font-weight:600;cursor:pointer;'
    mv.appendChild(btn)

    if (statusEl) statusEl.style.display = 'none'
    if (mountEl) {
      mountEl.hidden = false
      mountEl.style.position = 'relative'
      mountEl.appendChild(mv)
    }
  }

  function initAll() {
    var blocks = document.querySelectorAll('.ar-viewer-block')
    for (var i = 0; i < blocks.length; i++) {
      initBlock(blocks[i])
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll)
  } else {
    initAll()
  }
})()
