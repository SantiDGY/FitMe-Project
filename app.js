// ==========================================
// 1. MODELOS DE DATOS
// ==========================================

class Prenda {
  constructor(id, nombre, categoria, colorHex, formalidad, nivelAbrigo) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.colorHex = colorHex;
    this.formalidad = parseInt(formalidad);
    this.nivelAbrigo = parseInt(nivelAbrigo);
    this.estado = 'disponible';
    
    // Extracción automática de HSL
    const hsl = Prenda.hexToHSL(colorHex);
    this.hue = hsl.h;
    this.saturation = hsl.s;
    this.lightness = hsl.l;
  }

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

class Outfit {
  constructor(id, prendas) {
    this.id = id;
    this.prendas = prendas;
    this.fechaCreacion = new Date().toISOString();
  }

  get formalidadPromedio() {
    if (this.prendas.length === 0) return 0;
    const suma = this.prendas.reduce((acc, p) => acc + p.formalidad, 0);
    return (suma / this.prendas.length).toFixed(1);
  }
}

// ==========================================
// 2. GESTOR DE ESTADO (LOCALSTORAGE)
// ==========================================

const Armario = {
  prendas: JSON.parse(localStorage.getItem('fitme_prendas')) || [],

  guardar(prenda) {
    this.prendas.push(prenda);
    localStorage.setItem('fitme_prendas', JSON.stringify(this.prendas));
    this.render();
  },

  render() {
    const container = document.getElementById('grid-prendas');
    if (!container) return;
    
    container.innerHTML = '';

    this.prendas.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card-prenda';
      card.innerHTML = `
        <div>
          <div class="card-title">${p.nombre}</div>
          <div class="card-meta">${p.categoria.toUpperCase()}</div>
        </div>
        <div>
          <div class="card-meta">WARMTH: ${p.nivelAbrigo}/10</div>
          <div class="card-color-indicator" style="background-color: ${p.colorHex};"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }
};

// ==========================================
// 3. MOTOR DE RECOMENDACIÓN E INTELIGENCIA
// ==========================================

const OutfitGenerator = {
  generarAleatorio(prendasDisponibles) {
    const internas = prendasDisponibles.filter(p => p.categoria === 'Capa interna');
    const pantalones = prendasDisponibles.filter(p => p.categoria === 'Pantalón');
    const calzados = prendasDisponibles.filter(p => p.categoria === 'Calzado');
    const externas = prendasDisponibles.filter(p => p.categoria === 'Capa externa');

    if (internas.length === 0 || pantalones.length === 0 || calzados.length === 0) {
      return null;
    }

    const prendaInterna = internas[Math.floor(Math.random() * internas.length)];
    const pantalon = pantalones[Math.floor(Math.random() * pantalones.length)];
    const calzado = calzados[Math.floor(Math.random() * calzados.length)];

    const seleccion = [prendaInterna, pantalon, calzado];

    if (externas.length > 0 && Math.random() > 0.5) {
      const externa = externas[Math.floor(Math.random() * externas.length)];
      seleccion.push(externa);
    }

    return new Outfit(Date.now(), seleccion);
  }
};

const EvaluadorStylist = {
  evaluarColor(prendas) {
    const noNeutros = prendas.filter(p => p.saturation > 15 && p.lightness > 15 && p.lightness < 85);
    if (noNeutros.length <= 1) return 95;

    const hues = noNeutros.map(p => p.hue);
    const diferencia = Math.max(...hues) - Math.min(...hues);

    if (diferencia <= 60 || (diferencia >= 150 && diferencia <= 210)) {
      return 90;
    }
    return 65;
  },

  evaluarClima(prendas, tempObjetivo) {
    const abrigoTotal = prendas.reduce((acc, p) => acc + p.nivelAbrigo, 0);
    const abrigoIdeal = Math.max(2, Math.round((35 - tempObjetivo) / 2.5));
    const diferencia = Math.abs(abrigoTotal - abrigoIdeal);
    return Math.max(0, 100 - (diferencia * 12));
  },

  calcularScore(outfit, tempObjetivo) {
    const scoreColor = this.evaluarColor(outfit.prendas);
    const scoreClima = this.evaluarClima(outfit.prendas, tempObjetivo);
    return Math.round((scoreColor * 0.4) + (scoreClima * 0.6));
  }
};

const OutfitGeneratorInteligente = {
  generarMejorOption(prendasDisponibles, tempObjetivo) {
    const candidatos = [];
    const INTENTOS = 20;

    for (let i = 0; i < INTENTOS; i++) {
      const candidato = OutfitGenerator.generarAleatorio(prendasDisponibles);
      if (candidato) {
        candidato.score = EvaluadorStylist.calcularScore(candidato, tempObjetivo);
        candidatos.push(candidato);
      }
    }

    if (candidatos.length === 0) return null;

    candidatos.sort((a, b) => b.score - a.score);
    return candidatos[0];
  }
};

// ==========================================
// 4. INTERACCIÓN Y UI
// ==========================================

document.getElementById('formalidad')?.addEventListener('input', (e) => {
  document.getElementById('val-formalidad').textContent = e.target.value;
});

document.getElementById('abrigo')?.addEventListener('input', (e) => {
  document.getElementById('val-abrigo').textContent = e.target.value;
});

document.getElementById('temperatura-input')?.addEventListener('input', (e) => {
  const temp = e.target.value;
  document.getElementById('val-temp').textContent = `${temp}°C`;
  const displayHeader = document.getElementById('val-temp-display');
  if (displayHeader) displayHeader.textContent = `${temp}°C`;
});

document.getElementById('prenda-form')?.addEventListener('submit', (e) => {
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

document.getElementById('btn-generar')?.addEventListener('click', () => {
  const tempInput = document.getElementById('temperatura-input');
  const tempActual = tempInput ? parseInt(tempInput.value) : 18;
  const mejorOutfit = OutfitGeneratorInteligente.generarMejorOption(Armario.prendas, tempActual);
  
  if (mejorOutfit) {
    mostrarOutfit(mejorOutfit);
  } else {
    alert('Necesitas guardar al menos 1 Capa interna, 1 Pantalón y 1 Calzado en tu colección para generar combinaciones.');
  }
});

function mostrarOutfit(outfit) {
  const containerResult = document.getElementById('outfit-result');
  const listContainer = document.getElementById('outfit-prendas-list');
  const formalidadSpan = document.getElementById('outfit-formalidad');
  const scoreSpan = document.getElementById('outfit-score');

  if (!containerResult || !listContainer) return;

  listContainer.innerHTML = '';
  
  outfit.prendas.forEach(p => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.style.borderLeftColor = p.colorHex;
    item.innerHTML = `
      <div>
        <div class="layer-category">${p.categoria}</div>
        <div class="layer-name">${p.nombre}</div>
      </div>
    `;
    listContainer.appendChild(item);
  });

  if (formalidadSpan) formalidadSpan.textContent = outfit.formalidadPromedio;
  if (scoreSpan) scoreSpan.textContent = outfit.score || '90';
  containerResult.style.display = 'block';
}

// Inicialización
Armario.render();