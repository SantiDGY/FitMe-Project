// Clase para gestionar la prenda y sus transformaciones de color
class Prenda {
  constructor(id, nombre, categoria, colorHex, formalidad, nivelAbrigo) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.colorHex = colorHex;
    this.formalidad = parseInt(formalidad);
    this.nivelAbrigo = parseInt(nivelAbrigo);
    this.estado = 'disponible';
    
    // Extracción automática de propiedades HSL
    const hsl = Prenda.hexToHSL(colorHex);
    this.hue = hsl.h;
    this.saturation = hsl.s;
    this.lightness = hsl.l;
  }

  // Conversión matemática de HEX a HSL
  static hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
}

// Gestor de Estado y LocalStorage
const Armario = {
  prendas: JSON.parse(localStorage.getItem('fitme_prendas')) || [],

  guardar(prenda) {
    this.prendas.push(prenda);
    localStorage.setItem('fitme_prendas', JSON.stringify(this.prendas));
    this.render();
  },

  render() {
    const container = document.getElementById('grid-prendas');
    container.innerHTML = '';

    this.prendas.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card-prenda';
      card.style.borderLeftColor = p.colorHex;
      card.innerHTML = `
        <strong>${p.nombre}</strong><br>
        <small>${p.categoria}</small><br>
        <small>Abrigo: ${p.nivelAbrigo}/10</small>
      `;
      container.appendChild(card);
    });
  }
};

// Event Listeners y Sincronización de UI
document.getElementById('formalidad').addEventListener('input', (e) => {
  document.getElementById('val-formalidad').textContent = e.target.value;
});

document.getElementById('abrigo').addEventListener('input', (e) => {
  document.getElementById('val-abrigo').textContent = e.target.value;
});

document.getElementById('prenda-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nuevaPrenda = new Prenda(
    Date.now(),
    document.getElementById('nombre').value,
    document.getElementById('categoria').value,
    document.getElementById('color').value,
    document.getElementById('formalidad').value,
    document.getElementById('abrigo').value
  );

  Armario.guardar(nuevaPrenda);
  e.target.reset();
});

// Carga inicial
Armario.render();