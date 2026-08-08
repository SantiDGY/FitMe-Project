// ==========================================
// 1. DICCIONARIO DE CATEGORÍAS Y TIPOS
// ==========================================

const TIPOS_POR_CATEGORIA = {
  "Capa interna": ["Remera manga corta", "Remera manga larga", "Musculosa", "Top", "Camisa"],
  "Capa media": ["Sweater", "Cardigan", "Hoodie", "Buzo", "Chaleco"],
  "Capa externa": ["Campera", "Harrington", "Puffer", "Trench", "Abrigo", "Sobrecamisa"],
  "Parte inferior": ["Jean", "Cargo", "Baggy", "Barrel", "Straight", "Short", "Chino"],
  "Calzado": ["Sneaker", "Bota", "Loafer", "Zapato", "Sandalia"],
  "Accesorios": ["Cadena", "Cinturón", "Gorra", "Gorro", "Bufanda", "Reloj", "Anillo"]
};

// ==========================================
// 2. MODELOS DE DATOS
// ==========================================

class Prenda {
  constructor(datos = {}) {
    this.id = datos.id || Date.now();
    this.nombre = datos.nombre || "Sin nombre";
    this.categoria = datos.categoria || "Capa interna";
    this.tipoEspecifico = datos.tipoEspecifico || datos.tipo_especifico || "Prenda";
    this.marca = datos.marca || "Sin marca";
    this.material = datos.material || "Algodón";
    this.colorHex = datos.colorHex || "#000000";
    this.foto = datos.foto || "";
    this.temporada = datos.temporada || "Todas";
    
    // Escalas numéricas (1-10)
    this.formalidad = parseInt(datos.formalidad) || 5;
    this.cargaVisual = parseInt(datos.cargaVisual) || 3;
    this.nivelAbrigo = parseInt(datos.nivelAbrigo) || 5;
    
    // Estado y Metadatos
    this.estado = datos.estado || "disponible";
    this.favorita = Boolean(datos.favorita);
    this.fechaIncorporacion = datos.fechaIncorporacion || new Date().toISOString().split('T')[0];

    // Extracción automática de HSL
    const hsl = Prenda.hexToHSL(this.colorHex);
    this.hue = hsl.h;
    this.saturation = hsl.s;
    this.lightness = hsl.l;
  }

  static hexToHSL(hex) {
    if (!hex || typeof hex !== 'string') return { h: 0, s: 0, l: 0 };
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) cleanHex = "000000";

    let r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    let g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    let b = parseInt(cleanHex.slice(4, 6), 16) / 255;

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
    if (!this.prendas || this.prendas.length === 0) return 0;
    const suma = this.prendas.reduce((acc, p) => acc + (p.formalidad || 5), 0);
    return (suma / this.prendas.length).toFixed(1);
  }
}

// ==========================================
// 3. GESTOR DEL ARMARIO (LOCALSTORAGE)
// ==========================================

const Armario = {
  prendas: (JSON.parse(localStorage.getItem('fitme_prendas')) || []).map(p => new Prenda(p)),

  guardar(prenda) {
    this.prendas.push(prenda);
    localStorage.setItem('fitme_prendas', JSON.stringify(this.prendas));
    this.render();
  },

  render() {
    const container = document.getElementById('grid-prendas');
    if (!container) return;
    
    container.innerHTML = '';

    if (this.prendas.length === 0) {
      container.innerHTML = `<p class="empty-msg">No pieces in archive yet.</p>`;
      return;
    }

    this.prendas.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card-prenda';

      const tipoTexto = (p.tipoEspecifico || p.categoria || "PRENDA").toUpperCase();
      const marcaTexto = (p.marca || "SIN MARCA").toUpperCase();

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${p.nombre || 'Sin nombre'} ${p.favorita ? '★' : ''}</div>
          <div class="card-meta">${tipoTexto} · ${marcaTexto}</div>
        </div>
        ${p.foto ? `<img src="${p.foto}" alt="${p.nombre}" class="card-img">` : ''}
        <div class="card-details">
          <div class="card-meta">FORMALITY: ${p.formalidad}/10 | WARMTH: ${p.nivelAbrigo}/10</div>
          <div class="card-color-indicator" style="background-color: ${p.colorHex || '#000'};"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }
};

// ==========================================
// 4. MOTOR DE RECOMENDACIÓN E INTELIGENCIA
// ==========================================

const OutfitGenerator = {
  generarAleatorio(prendasDisponibles) {
    const internas = prendasDisponibles.filter(p => p.categoria === 'Capa interna');
    const pantalones = prendasDisponibles.filter(p => p.categoria === 'Parte inferior' || p.categoria === 'Pantalón');
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
    const abrigoTotal = prendas.reduce((acc, p) => acc + (p.nivelAbrigo || 5), 0);
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
// 5. EVENTOS E INTERACCIÓN DE USUARIO
// ==========================================

document.getElementById('categoria')?.addEventListener('change', (e) => {
  const catSeleccionada = e.target.value;
  const selectTipo = document.getElementById('tipo_especifico');
  
  if (!selectTipo) return;

  selectTipo.innerHTML = '<option value="" disabled selected>Select type...</option>';
  
  if (TIPOS_POR_CATEGORIA[catSeleccionada]) {
    TIPOS_POR_CATEGORIA[catSeleccionada].forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      selectTipo.appendChild(option);
    });
    selectTipo.disabled = false;
  } else {
    selectTipo.disabled = true;
  }
});

document.getElementById('formalidad')?.addEventListener('input', e => {
  document.getElementById('val-formalidad').textContent = e.target.value;
});
document.getElementById('carga_visual')?.addEventListener('input', e => {
  document.getElementById('val-carga').textContent = e.target.value;
});
document.getElementById('abrigo')?.addEventListener('input', e => {
  document.getElementById('val-abrigo').textContent = e.target.value;
});
document.getElementById('temperatura-input')?.addEventListener('input', (e) => {
  const temp = e.target.value;
  document.getElementById('val-temp').textContent = `${temp}°C`;
  const displayHeader = document.getElementById('val-temp-display');
  if (displayHeader) displayHeader.textContent = `${temp}°C`;
});

// Variable global para almacenar temporalmente la imagen procesada
let fotoBase64Data = "";
// ==========================================
// 6. PROCESAMIENTO VISUAL (EXTRACCIÓN POR MEDIA PONDERADA DE SATURACIÓN)
// ==========================================

const fotoUpload = document.getElementById('foto-upload');
const colorInput = document.getElementById('color');
const canvas = document.getElementById('image-canvas');

fotoUpload?.addEventListener('change', (evento) => {
  const archivo = evento.target.files[0];
  if (!archivo || !canvas) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    fotoBase64Data = e.target.result;
    const img = new Image();
    img.src = fotoBase64Data;

    img.onload = function() {
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixeles = imageData.data;

      let rSumaPonderada = 0;
      let gSumaPonderada = 0;
      let bSumaPonderada = 0;
      let pesoTotal = 0;

      for (let i = 0; i < pixeles.length; i += 4) {
        const r = pixeles[i];
        const g = pixeles[i + 1];
        const b = pixeles[i + 2];
        const alpha = pixeles[i + 3];

        if (alpha < 125) continue;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const brillo = (r * 299 + g * 587 + b * 114) / 1000;
        const saturacion = max === 0 ? 0 : delta / max;

        // Descartar fondos muy claros, sombras oscuras y neutros
        const esFondoOBrillo = brillo > 215;
        const esSombraPura = brillo < 12;
        const esMuyNeutro = saturacion < 0.10 && brillo > 70;

        if (!esFondoOBrillo && !esSombraPura && !esMuyNeutro) {
          // El peso crece exponencialmente con la saturación
          const peso = Math.pow(saturacion, 2);

          rSumaPonderada += r * peso;
          gSumaPonderada += g * peso;
          bSumaPonderada += b * peso;
          pesoTotal += peso;
        }
      }

      if (pesoTotal > 0) {
        const rFinal = Math.round(rSumaPonderada / pesoTotal);
        const gFinal = Math.round(gSumaPonderada / pesoTotal);
        const bFinal = Math.round(bSumaPonderada / pesoTotal);

        const rgbToHex = (r, g, b) => {
          return "#" + [r, g, b].map(x => {
            const hex = Math.min(255, Math.max(0, x)).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("").toUpperCase();
        };

        const hexDetectado = rgbToHex(rFinal, gFinal, bFinal);
        if (colorInput) colorInput.value = hexDetectado;
      }
    };
  };

  reader.readAsDataURL(archivo);
});
// Guardado del formulario
document.getElementById('prenda-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const selectTipo = document.getElementById('tipo_especifico');

  const datosPrenda = {
    nombre: document.getElementById('nombre').value,
    categoria: document.getElementById('categoria').value,
    tipoEspecifico: selectTipo ? selectTipo.value : '',
    marca: document.getElementById('marca').value,
    material: document.getElementById('material').value,
    temporada: document.getElementById('temporada').value,
    colorHex: document.getElementById('color').value,
    foto: fotoBase64Data, // Almacenamos la imagen cargada
    formalidad: document.getElementById('formalidad').value,
    cargaVisual: document.getElementById('carga_visual').value,
    nivelAbrigo: document.getElementById('abrigo').value,
    estado: document.getElementById('estado').value,
    favorita: document.getElementById('favorita').checked
  };

  const nuevaPrenda = new Prenda(datosPrenda);
  Armario.guardar(nuevaPrenda);
  
  e.target.reset();
  fotoBase64Data = ""; // Limpiamos la imagen temporal
  if (selectTipo) selectTipo.disabled = true;
});

// Botón de generación
document.getElementById('btn-generar')?.addEventListener('click', () => {
  const tempInput = document.getElementById('temperatura-input');
  const tempActual = tempInput ? parseInt(tempInput.value) : 18;
  const mejorOutfit = OutfitGeneratorInteligente.generarMejorOption(Armario.prendas, tempActual);
  
  if (mejorOutfit) {
    mostrarOutfit(mejorOutfit);
  } else {
    alert('Necesitas guardar al menos 1 Capa interna, 1 Parte inferior y 1 Calzado en tu colección para generar combinaciones.');
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

// Carga e inicialización
Armario.render();