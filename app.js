// ==========================================
// 1. DICCIONARIOS DE CONFIGURACIÓN Y PERFILES
// ==========================================

const TIPOS_POR_CATEGORIA = {
  "Capa interna": ["Remera manga corta", "Remera manga larga", "Musculosa", "Top", "Camisa"],
  "Capa media": ["Sweater", "Cardigan", "Hoodie", "Buzo", "Chaleco"],
  "Capa externa": ["Campera", "Harrington", "Puffer", "Trench", "Abrigo", "Sobrecamisa"],
  "Parte inferior": ["Jean", "Cargo", "Baggy", "Barrel", "Straight", "Short", "Chino"],
  "Calzado": ["Sneaker", "Bota", "Loafer", "Zapato", "Sandalia"],
  "Accesorios": ["Cadena", "Cinturón", "Gorra", "Gorro", "Bufanda", "Reloj", "Anillo"]
};

// Diccionario global de perfiles por ocasión de uso
const PERFILES_OCASION = {
  "Casual": { formalidadMin: 1, formalidadMax: 5, cargaMax: 8, estilosFav: ["casual", "minimalista", "streetwear"] },
  "Merienda": { formalidadMin: 3, formalidadMax: 7, cargaMax: 7, estilosFav: ["casual", "preppy", "old_money"] },
  "Trabajo": { formalidadMin: 5, formalidadMax: 9, cargaMax: 5, estilosFav: ["formal", "minimalista", "preppy"] },
  "Noche": { formalidadMin: 4, formalidadMax: 8, cargaMax: 9, estilosFav: ["streetwear", "casual", "night"] },
  "Formal": { formalidadMin: 7, formalidadMax: 10, cargaMax: 4, estilosFav: ["formal", "old_money"] }
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
// 4. MOTOR DE EVALUACIÓN MULTINIVEL Y GENERADOR
// ==========================================

class FitMeEngine {
  
  // CAPA 0: REGLAS DURAS (SANITY CHECKS)
  static evaluarReglasDuras(prendas, contexto) {
    const advertencias = [];
    let estado = "COMPATIBLE";

    const abrigoTotal = prendas.reduce((acc, p) => acc + (p.nivelAbrigo || 5), 0);
    const temp = contexto.temperatura ?? 18;
    const esLluvia = contexto.lluvia ?? false;

    if (temp >= 28 && abrigoTotal >= 18) {
      advertencias.push("Exceso térmico: Nivel de abrigo demasiado alto para la temperatura actual.");
      estado = "INCOMPATIBLE";
    }
    if (temp <= 8 && abrigoTotal < 8) {
      advertencias.push("Aislamiento insuficiente para el frío actual.");
      estado = "INCOMPATIBLE";
    }

    if (esLluvia) {
      const tieneProteccionLluvia = prendas.some(p => p.material === "Nylon" || p.material === "Cuero");
      if (!tieneProteccionLluvia) {
        advertencias.push("Falta de protección contra lluvia en capas externas.");
        if (estado !== "INCOMPATIBLE") estado = "WARNING";
      }
    }

    const categoriasPresentes = prendas.map(p => p.categoria);
    const duplicadosInternos = categoriasPresentes.filter((cat, idx) => cat === "Capa interna" && categoriasPresentes.indexOf(cat) !== idx);
    if (duplicadosInternos.length > 0) {
      advertencias.push("Conflicto de superposición: Dos capas internas seleccionadas.");
      estado = "INCOMPATIBLE";
    }

    return { estado, advertencias };
  }

  // CAPA 1: ARMONÍA DE COLOR
  static evaluarColorAvanzado(prendas) {
    const noNeutros = prendas.filter(p => p.saturation > 15 && p.lightness > 15 && p.lightness < 85);
    
    if (noNeutros.length <= 1) return { score: 95, razon: "Paleta neutra limpia y versátil." };

    const hues = noNeutros.map(p => p.hue);
    const diferencia = Math.max(...hues) - Math.min(...hues);
    const cargaVisualMedia = prendas.reduce((acc, p) => acc + (p.cargaVisual || 3), 0) / prendas.length;

    let score = 70;
    let razon = "La combinación presenta un contraste moderado.";

    if (diferencia <= 45) {
      score = 92;
      razon = "Paleta análoga en tono: colores armónicos y contiguos.";
    } else if (diferencia >= 150 && diferencia <= 210) {
      score = 90;
      razon = "Relación cromática complementaria de alto contraste.";
    } else if (cargaVisualMedia > 7) {
      score = 60;
      razon = "Atención: Elevada carga visual general entre componentes.";
    }

    return { score, razon };
  }

  // CAPA 2: COHERENCIA DE FORMALIDAD
  static evaluarCoherenciaFormalidad(prendas) {
    if (prendas.length === 0) return { score: 0, promedio: 0, dispersion: 0 };

    const valores = prendas.map(p => p.formalidad || 5);
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    
    const varianza = valores.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / valores.length;
    const desviacion = Math.sqrt(varianza);

    let scoreCoherencia = Math.max(0, 100 - (desviacion * 18));

    return {
      score: Math.round(scoreCoherencia),
      promedio: promedio.toFixed(1),
      desviacion: desviacion.toFixed(1)
    };
  }

  // EVALUACIÓN GENERAL
  static evaluarOutfitCompleto(outfit, contexto = {}) {
    const prendas = outfit.prendas;
    
    const reglas = this.evaluarReglasDuras(prendas, contexto);
    if (reglas.estado === "INCOMPATIBLE") {
      return {
        compatibilityScore: 0,
        recommendationScore: 0,
        estado: "INCOMPATIBLE",
        explicacion: reglas.advertencias.join(" "),
        desglose: { color: 0, clima: 0, formalidad: 0, formalidadPromedio: 0 }
      };
    }

    const evalColor = this.evaluarColorAvanzado(prendas);
    const evalFormalidad = this.evaluarCoherenciaFormalidad(prendas);
    
    const abrigoTotal = prendas.reduce((acc, p) => acc + (p.nivelAbrigo || 5), 0);
    const tempTarget = contexto.temperatura ?? 18;
    const abrigoIdeal = Math.max(2, Math.round((35 - tempTarget) / 2.5));
    const difAbrigo = Math.abs(abrigoTotal - abrigoIdeal);
    const scoreClima = Math.max(0, 100 - (difAbrigo * 12));

    const compatibilityScore = Math.round((evalColor.score * 0.5) + (evalFormalidad.score * 0.5));
    const recommendationScore = Math.round((compatibilityScore * 0.5) + (scoreClima * 0.5));

    let explicacion = evalColor.razon;
    if (scoreClima > 85) {
      explicacion += " El abrigo es óptimo para el clima actual.";
    } else {
      explicacion += ` Ajuste térmico moderado para los ${tempTarget}°C.`;
    }

    return {
      compatibilityScore,
      recommendationScore,
      estado: reglas.estado,
      explicacion,
      desglose: {
        color: evalColor.score,
        clima: scoreClima,
        formalidad: evalFormalidad.score,
        formalidadPromedio: evalFormalidad.promedio
      }
    };
  }
}

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

const OutfitGeneratorInteligente = {
  generarMejorOption(prendasDisponibles, tempObjetivo) {
    const candidatos = [];
    const INTENTOS = 25;

    for (let i = 0; i < INTENTOS; i++) {
      const candidato = OutfitGenerator.generarAleatorio(prendasDisponibles);
      if (candidato) {
        const evaluacion = FitMeEngine.evaluarOutfitCompleto(candidato, { temperatura: tempObjetivo });
        if (evaluacion.estado !== "INCOMPATIBLE") {
          candidato.evaluacion = evaluacion;
          candidato.score = evaluacion.recommendationScore;
          candidatos.push(candidato);
        }
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
  BuilderStudio.recalcular();
});

let fotoBase64Data = "";

// ==========================================
// 6. PROCESAMIENTO VISUAL (MEDIA PONDERADA DE SATURACIÓN)
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

      let rSumaPonderada = 0, gSumaPonderada = 0, bSumaPonderada = 0, pesoTotal = 0;

      for (let i = 0; i < pixeles.length; i += 4) {
        const r = pixeles[i], g = pixeles[i + 1], b = pixeles[i + 2], alpha = pixeles[i + 3];
        if (alpha < 125) continue;

        const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
        const brillo = (r * 299 + g * 587 + b * 114) / 1000;
        const saturacion = max === 0 ? 0 : delta / max;

        const esFondoOBrillo = brillo > 215;
        const esSombraPura = brillo < 12;
        const esMuyNeutro = saturacion < 0.10 && brillo > 70;

        if (!esFondoOBrillo && !esSombraPura && !esMuyNeutro) {
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

        const rgbToHex = (r, g, b) => "#" + [r, g, b].map(x => {
          const hex = Math.min(255, Math.max(0, x)).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();

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
    foto: fotoBase64Data,
    formalidad: document.getElementById('formalidad').value,
    cargaVisual: document.getElementById('carga_visual').value,
    nivelAbrigo: document.getElementById('abrigo').value,
    estado: document.getElementById('estado').value,
    favorita: document.getElementById('favorita').checked
  };

  const nuevaPrenda = new Prenda(datosPrenda);
  Armario.guardar(nuevaPrenda);
  
  e.target.reset();
  fotoBase64Data = "";
  if (selectTipo) selectTipo.disabled = true;
});

// Generación con botón
document.getElementById('btn-generar')?.addEventListener('click', () => {
  const tempInput = document.getElementById('temperatura-input');
  const tempActual = tempInput ? parseInt(tempInput.value) : 18;
  const mejorOutfit = OutfitGeneratorInteligente.generarMejorOption(Armario.prendas, tempActual);
  
  if (mejorOutfit) {
    mostrarOutfit(mejorOutfit);
  } else {
    alert('Se requieren piezas compatibles (Capa interna, Parte inferior y Calzado) para sugerir combinaciones.');
  }
});

function mostrarOutfit(outfit) {
  const containerResult = document.getElementById('outfit-result');
  const listContainer = document.getElementById('outfit-prendas-list');
  const scoreSpan = document.getElementById('outfit-score');
  const explicacionText = document.getElementById('outfit-explicacion');

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

  const evaluacion = outfit.evaluacion || FitMeEngine.evaluarOutfitCompleto(outfit, { temperatura: 18 });

  if (scoreSpan) scoreSpan.textContent = evaluacion.recommendationScore;
  if (explicacionText) explicacionText.textContent = evaluacion.explicacion;

  const elCompat = document.getElementById('metric-compat');
  const elColor = document.getElementById('metric-color-val');
  const elClima = document.getElementById('metric-clima-val');

  if (elCompat) elCompat.textContent = evaluacion.compatibilityScore;
  if (elColor) elColor.textContent = evaluacion.desglose.color;
  if (elClima) elClima.textContent = evaluacion.desglose.clima;

  containerResult.style.display = 'block';
}

// ==========================================
// 7. STUDIO BUILDER (CONSTRUCTOR MANUAL)
// ==========================================

const BuilderStudio = {
  slots: {
    "Capa interna": null,
    "Capa media": null,
    "Capa externa": null,
    "Parte inferior": null,
    "Calzado": null
  },

  poblarSelects() {
    const mapeoSelects = {
      "Capa interna": document.getElementById('slot-interna'),
      "Capa media": document.getElementById('slot-media'),
      "Capa externa": document.getElementById('slot-externa'),
      "Parte inferior": document.getElementById('slot-inferior'),
      "Calzado": document.getElementById('slot-calzado')
    };

    for (const [categoria, selectEl] of Object.entries(mapeoSelects)) {
      if (!selectEl) continue;

      const esOpcional = categoria.includes('media') || categoria.includes('externa');
      selectEl.innerHTML = esOpcional 
        ? '<option value="">-- Ninguna --</option>' 
        : '<option value="">-- Sin seleccionar --</option>';

      const prendasCat = Armario.prendas.filter(p => p.categoria === categoria || (categoria === 'Parte inferior' && p.categoria === 'Pantalón'));

      prendasCat.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombre} (${p.tipoEspecifico || p.categoria})`;
        selectEl.appendChild(option);
      });
    }
  },

  getPrendasSeleccionadas() {
    return Object.values(this.slots).filter(p => p !== null);
  },

  recalcular() {
    const prendasActuales = this.getPrendasSeleccionadas();
    const stackContainer = document.getElementById('builder-stack');
    const btnGuardar = document.getElementById('btn-guardar-builder');

    if (!stackContainer) return;

    stackContainer.innerHTML = '';

    if (prendasActuales.length === 0) {
      stackContainer.innerHTML = `<p class="empty-msg">Selecciona prendas para iniciar la composición.</p>`;
      this.actualizarMetricas(0, 0, 0, 0);
      if (btnGuardar) btnGuardar.disabled = true;
      return;
    }

    prendasActuales.forEach(p => {
      const item = document.createElement('div');
      item.className = 'layer-item';
      item.style.borderLeftColor = p.colorHex || '#000';
      item.innerHTML = `
        <div>
          <div class="layer-category">${p.categoria}</div>
          <div class="layer-name">${p.nombre}</div>
        </div>
      `;
      stackContainer.appendChild(item);
    });

    const tempInput = document.getElementById('temperatura-input');
    const tempActual = tempInput ? parseInt(tempInput.value) : 18;

    const outfitTemp = new Outfit(Date.now(), prendasActuales);
    const evaluacion = FitMeEngine.evaluarOutfitCompleto(outfitTemp, { temperatura: tempActual });

    this.actualizarMetricas(
      evaluacion.recommendationScore, 
      evaluacion.desglose.color, 
      evaluacion.desglose.clima, 
      evaluacion.desglose.formalidadPromedio
    );

    const tieneBase = this.slots["Capa interna"] && this.slots["Parte inferior"] && this.slots["Calzado"];
    if (btnGuardar) btnGuardar.disabled = !tieneBase || evaluacion.estado === "INCOMPATIBLE";
  },

  actualizarMetricas(match, color, clima, formalidad) {
    const elMatch = document.getElementById('builder-match');
    const elColor = document.getElementById('metric-color');
    const elClima = document.getElementById('metric-clima');
    const elFormalidad = document.getElementById('metric-formalidad');

    if (elMatch) elMatch.textContent = match;
    if (elColor) elColor.textContent = color;
    if (elClima) elClima.textContent = clima;
    if (elFormalidad) elFormalidad.textContent = formalidad;
  }
};

const vincularSlot = (elementId, categoria) => {
  document.getElementById(elementId)?.addEventListener('change', (e) => {
    const idPrenda = e.target.value;
    BuilderStudio.slots[categoria] = idPrenda 
      ? Armario.prendas.find(p => p.id == idPrenda) || null 
      : null;
    BuilderStudio.recalcular();
  });
};

vincularSlot('slot-interna', 'Capa interna');
vincularSlot('slot-media', 'Capa media');
vincularSlot('slot-externa', 'Capa externa');
vincularSlot('slot-inferior', 'Parte inferior');
vincularSlot('slot-calzado', 'Calzado');

document.getElementById('btn-guardar-builder')?.addEventListener('click', () => {
  const prendas = BuilderStudio.getPrendasSeleccionadas();
  const ocasion = document.getElementById('slot-ocasion')?.value || 'Casual';

  const nuevoOutfit = new Outfit(Date.now(), prendas);
  nuevoOutfit.ocasion = ocasion;

  const historialOutfits = JSON.parse(localStorage.getItem('fitme_outfits')) || [];
  historialOutfits.push(nuevoOutfit);
  localStorage.setItem('fitme_outfits', JSON.stringify(historialOutfits));

  alert('¡Outfit guardado con éxito en tu colección!');
});

const funcionGuardarOriginal = Armario.guardar.bind(Armario);
Armario.guardar = function(prenda) {
  funcionGuardarOriginal(prenda);
  BuilderStudio.poblarSelects();
};

BuilderStudio.poblarSelects();

// ==========================================
// 8. GESTOR DE OUTFITS GUARDADOS (LOOKBOOK)
// ==========================================

const Lookbook = {
  obtenerGuardados() {
    const raw = localStorage.getItem('fitme_outfits');
    if (!raw) return [];
    
    try {
      const parsed = JSON.parse(raw);
      return parsed.map(o => {
        const prendasInstanciadas = o.prendas.map(p => new Prenda(p));
        const outfitObj = new Outfit(o.id, prendasInstanciadas);
        outfitObj.ocasion = o.ocasion || 'Casual';
        return outfitObj;
      });
    } catch (e) {
      console.error("Error al leer outfits de localStorage:", e);
      return [];
    }
  },

  eliminar(id) {
    const listaActual = this.obtenerGuardados();
    const listaFiltrada = listaActual.filter(o => o.id !== id);
    localStorage.setItem('fitme_outfits', JSON.stringify(listaFiltrada));
    this.render();
  },

  render() {
    const container = document.getElementById('grid-outfits');
    if (!container) return;

    const outfits = this.obtenerGuardados();
    container.innerHTML = '';

    if (outfits.length === 0) {
      container.innerHTML = `<p class="empty-msg">No hay outfits guardados aún. Usa el Studio Builder para guardar tus combinaciones.</p>`;
      return;
    }

    outfits.forEach((outfit, index) => {
      const card = document.createElement('div');
      card.className = 'outfit-card-saved';

      const capasHTML = outfit.prendas.map(p => `
        <div class="layer-item-mini">
          <div class="color-dot" style="background-color: ${p.colorHex || '#000'}"></div>
          <span class="layer-name">${p.nombre}</span>
          <span class="layer-cat-mini">${p.categoria}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="outfit-card-header">
          <span class="outfit-number">LOOK #${String(index + 1).padStart(2, '0')}</span>
          <span class="outfit-ocasion">${outfit.ocasion.toUpperCase()}</span>
        </div>

        <div class="layers-stack-saved">
          ${capasHTML}
        </div>

        <div class="outfit-card-footer">
          <div class="metric">
            <span class="metric-label">FORMALITY</span>
            <span class="metric-value">${outfit.formalidadPromedio}/10</span>
          </div>
          <button class="btn-delete-outfit" data-id="${outfit.id}">DELETE</button>
        </div>
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('.btn-delete-outfit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.getAttribute('data-id'));
        this.eliminar(id);
      });
    });
  }
};

document.getElementById('btn-guardar-builder')?.addEventListener('click', () => {
  setTimeout(() => {
    Lookbook.render();
  }, 100);
});

// ==========================================
// 9. MÓDULO "SORPRÉNDEME" (GENERADOR MÚLTIPLE Y FEEDBACK)
// ==========================================

const GeneradorSorprendeme = {
  looksActuales: [],

  generarLoteDeLooks(cantidad = 3) {
    const tempInput = document.getElementById('temperatura-input');
    const tempActual = tempInput ? parseInt(tempInput.value) : 18;
    const candidatos = [];
    const INTENTOS = 50;

    for (let i = 0; i < INTENTOS; i++) {
      const candidato = OutfitGenerator.generarAleatorio(Armario.prendas);
      if (candidato) {
        const evaluacion = FitMeEngine.evaluarOutfitCompleto(candidato, { temperatura: tempActual });
        
        if (evaluacion.estado !== "INCOMPATIBLE") {
          candidato.evaluacion = evaluacion;
          candidato.score = evaluacion.recommendationScore;
          candidatos.push(candidato);
        }
      }
    }

    if (candidatos.length === 0) return [];

    candidatos.sort((a, b) => b.score - a.score);

    const seleccionados = [];
    for (const cand of candidatos) {
      if (seleccionados.length >= cantidad) break;
      
      const idsActuales = cand.prendas.map(p => p.id).sort().join(',');
      const yaExiste = seleccionados.some(s => s.prendas.map(p => p.id).sort().join(',') === idsActuales);

      if (!yaExiste) {
        seleccionados.push(cand);
      }
    }

    return seleccionados;
  },

  ejecutar() {
    const container = document.getElementById('multi-outfits-container');
    if (!container) return;

    this.looksActuales = this.generarLoteDeLooks(3);

    if (this.looksActuales.length === 0) {
      alert('Necesitas guardar al menos 1 Capa interna, 1 Parte inferior y 1 Calzado en tu colección para generar combinaciones.');
      return;
    }

    container.style.display = 'grid';
    this.render();
  },

  regenerarUno(index) {
    const nuevos = this.generarLoteDeLooks(5);
    const idsEnPantalla = this.looksActuales.map(l => l ? l.prendas.map(p => p.id).sort().join(',') : '');
    
    const reemplazo = nuevos.find(n => {
      const idN = n.prendas.map(p => p.id).sort().join(',');
      return !idsEnPantalla.includes(idN);
    });

    if (reemplazo) {
      this.looksActuales[index] = reemplazo;
      this.render();
    } else {
      alert('No hay suficientes combinaciones alternativas en tu armario actual.');
    }
  },

  render() {
    const container = document.getElementById('multi-outfits-container');
    if (!container) return;

    container.innerHTML = '';

    this.looksActuales.forEach((outfit, index) => {
      if (!outfit) return;

      const card = document.createElement('div');
      card.className = 'outfit-card-saved';

      const capasHTML = outfit.prendas.map(p => `
        <div class="layer-item-mini">
          <div class="color-dot" style="background-color: ${p.colorHex || '#000'}"></div>
          <span class="layer-name">${p.nombre}</span>
          <span class="layer-cat-mini">${p.categoria}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="outfit-card-header">
          <span class="outfit-number">LOOK #${String(index + 1).padStart(2, '0')}</span>
          <span class="match-score">${outfit.score}% MATCH</span>
        </div>

        <p class="outfit-explanation-text" style="font-size: 0.75rem; margin-bottom: 8px;">
          ${outfit.evaluacion.explicacion}
        </p>

        <div class="layers-stack-saved">
          ${capasHTML}
        </div>

        <div class="feedback-actions">
          <button class="btn-feedback btn-like" data-index="${index}" title="Guardar en Lookbook">❤️ ME GUSTA</button>
          <button class="btn-feedback btn-dislike" data-index="${index}" title="Descartar propuesta">👎 NO ME GUSTA</button>
          <button class="btn-feedback btn-refresh" data-index="${index}" title="Probar otro look">🔄 OTRA</button>
        </div>
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-index'));
        const outfitAGuardar = this.looksActuales[idx];
        
        const historial = JSON.parse(localStorage.getItem('fitme_outfits')) || [];
        historial.push(outfitAGuardar);
        localStorage.setItem('fitme_outfits', JSON.stringify(historial));

        alert(`¡LOOK #${idx + 1} guardado en tu Lookbook!`);
        Lookbook.render();
      });
    });

    container.querySelectorAll('.btn-dislike').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-index'));
        this.regenerarUno(idx);
      });
    });

    container.querySelectorAll('.btn-refresh').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-index'));
        this.regenerarUno(idx);
      });
    });
  }
};

document.getElementById('btn-sorprendeme')?.addEventListener('click', () => {
  GeneradorSorprendeme.ejecutar();
});

// ==========================================
// 10. MÓDULO PRENDA PROTAGONISTA (HERO PIECE)
// ==========================================

const HeroPieceStylist = {
  heroPrendaSeleccionada: null,
  outfitHeroActual: null,

  poblarSelectorHero() {
    const selectEl = document.getElementById('select-hero-item');
    if (!selectEl) return;

    selectEl.innerHTML = '<option value="">-- Elige una pieza de tu armario --</option>';

    Armario.prendas.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.nombre} (${p.categoria} - ${p.colorHex})`;
      selectEl.appendChild(option);
    });
  },

  generarAlrededorDe(heroPrenda) {
    const tempInput = document.getElementById('temperatura-input');
    const tempActual = tempInput ? parseInt(tempInput.value) : 18;

    const candidatos = [];
    const INTENTOS = 40;

    for (let i = 0; i < INTENTOS; i++) {
      const internas = Armario.prendas.filter(p => p.categoria === 'Capa interna');
      const pantalones = Armario.prendas.filter(p => p.categoria === 'Parte inferior' || p.categoria === 'Pantalón');
      const calzados = Armario.prendas.filter(p => p.categoria === 'Calzado');
      const externas = Armario.prendas.filter(p => p.categoria === 'Capa externa');

      if (internas.length === 0 || pantalones.length === 0 || calzados.length === 0) continue;

      let pInterna = heroPrenda.categoria === 'Capa interna' ? heroPrenda : internas[Math.floor(Math.random() * internas.length)];
      let pPantalon = (heroPrenda.categoria === 'Parte inferior' || heroPrenda.categoria === 'Pantalón') ? heroPrenda : pantalones[Math.floor(Math.random() * pantalones.length)];
      let pCalzado = heroPrenda.categoria === 'Calzado' ? heroPrenda : calzados[Math.floor(Math.random() * calzados.length)];

      const seleccion = [pInterna, pPantalon, pCalzado];

      if (heroPrenda.categoria === 'Capa externa') {
        seleccion.push(heroPrenda);
      } else if (externas.length > 0 && Math.random() > 0.6) {
        seleccion.push(externas[Math.floor(Math.random() * externas.length)]);
      }

      const candidatoOutfit = new Outfit(Date.now(), seleccion);
      const evaluacion = FitMeEngine.evaluarOutfitCompleto(candidatoOutfit, { temperatura: tempActual });

      if (evaluacion.estado !== "INCOMPATIBLE") {
        let bonusBalance = 0;
        const secundarias = seleccion.filter(p => p.id !== heroPrenda.id);
        const cargaSecundariasPromedio = secundarias.reduce((acc, p) => acc + (p.cargaVisual || 3), 0) / secundarias.length;

        if (heroPrenda.cargaVisual >= 6 && cargaSecundariasPromedio <= 4) {
          bonusBalance = 15;
        }

        candidatoOutfit.evaluacion = evaluacion;
        candidatoOutfit.score = Math.min(100, evaluacion.recommendationScore + bonusBalance);
        candidatos.push(candidatoOutfit);
      }
    }

    if (candidatos.length === 0) return null;

    candidatos.sort((a, b) => b.score - a.score);
    return candidatos[0];
  },

  ejecutar() {
    if (!this.heroPrendaSeleccionada) return;

    const mejorOutfit = this.generarAlrededorDe(this.heroPrendaSeleccionada);
    if (!mejorOutfit) {
      alert('No se encontraron combinaciones suficientes en tu armario para destacar esta prenda.');
      return;
    }

    this.outfitHeroActual = mejorOutfit;

    const container = document.getElementById('hero-outfit-result');
    const adviceText = document.getElementById('hero-stylist-advice');
    const scoreText = document.getElementById('hero-match-score');
    const stackContainer = document.getElementById('hero-prendas-stack');

    if (!container || !stackContainer) return;

    let consejo = `Protagonista: ${this.heroPrendaSeleccionada.nombre.toUpperCase()}.`;
    if (this.heroPrendaSeleccionada.cargaVisual >= 6) {
      consejo += " Manteniendo una baja carga visual en las prendas secundarias para que la pieza principal sea el punto focal indiscutible.";
    } else {
      consejo += " La prenda se integra fluidamente con elementos de soporte cromático equivalente.";
    }

    if (adviceText) adviceText.textContent = consejo;
    if (scoreText) scoreText.textContent = mejorOutfit.score;

    stackContainer.innerHTML = '';
    mejorOutfit.prendas.forEach(p => {
      const item = document.createElement('div');
      item.className = 'layer-item';
      if (p.id === this.heroPrendaSeleccionada.id) {
        item.style.borderLeft = `5px solid ${p.colorHex || '#000'}`;
        item.style.background = 'var(--card-bg)';
      } else {
        item.style.borderLeftColor = p.colorHex || '#000';
      }

      item.innerHTML = `
        <div>
          <div class="layer-category">${p.categoria} ${p.id === this.heroPrendaSeleccionada.id ? '★ HERO' : ''}</div>
          <div class="layer-name">${p.nombre}</div>
        </div>
      `;
      stackContainer.appendChild(item);
    });

    container.style.display = 'block';
  }
};

document.getElementById('select-hero-item')?.addEventListener('change', (e) => {
  const idPrenda = e.target.value;
  const btnGenerar = document.getElementById('btn-generar-hero');
  
  HeroPieceStylist.heroPrendaSeleccionada = idPrenda 
    ? Armario.prendas.find(p => p.id == idPrenda) || null 
    : null;

  if (btnGenerar) {
    btnGenerar.disabled = !HeroPieceStylist.heroPrendaSeleccionada;
  }
});

document.getElementById('btn-generar-hero')?.addEventListener('click', () => {
  HeroPieceStylist.ejecutar();
});

document.getElementById('btn-guardar-hero-outfit')?.addEventListener('click', () => {
  if (!HeroPieceStylist.outfitHeroActual) return;

  const historial = JSON.parse(localStorage.getItem('fitme_outfits')) || [];
  historial.push(HeroPieceStylist.outfitHeroActual);
  localStorage.setItem('fitme_outfits', JSON.stringify(historial));

  alert('¡Outfit protagonista guardado con éxito en tu Lookbook!');
  Lookbook.render();
});

const guardarOriginalHero = Armario.guardar.bind(Armario);
Armario.guardar = function(prenda) {
  guardarOriginalHero(prenda);
  HeroPieceStylist.poblarSelectorHero();
};

HeroPieceStylist.poblarSelectorHero();

// ==========================================
// 11. MÓDULO BÚSQUEDA DESDE CERO (CONTEXT STYLIST)
// ==========================================

const SearchOutfitStylist = {
  
  mapearClimaATemperatura(clima) {
    switch (clima) {
      case 'frio': return 8;
      case 'caluroso': return 28;
      case 'templado':
      default: return 18;
    }
  },

  cumplePaletaColor(prenda, paleta) {
    if (paleta === 'todas') return true;

    const { hue, saturation, lightness } = prenda;

    if (paleta === 'neutra') {
      return saturation < 20 || lightness > 85 || lightness < 15;
    }

    if (paleta === 'tierra') {
      const esTierraHue = hue >= 10 && hue <= 85;
      const esLuminosidadMedia = lightness >= 20 && lightness <= 75;
      return esTierraHue && esLuminosidadMedia;
    }

    if (paleta === 'fria') {
      return hue >= 160 && hue <= 260;
    }

    return true;
  },

  buscar() {
    const estilo = document.getElementById('search-estilo')?.value || 'todos';
    const ocasion = document.getElementById('search-ocasion')?.value || 'Casual';
    const clima = document.getElementById('search-clima')?.value || 'templado';
    const paleta = document.getElementById('search-paleta')?.value || 'todas';

    const tempTarget = this.mapearClimaATemperatura(clima);
    const perfilOcasion = PERFILES_OCASION[ocasion] || PERFILES_OCASION["Casual"];

    const prendasValidas = Armario.prendas.filter(p => this.cumplePaletaColor(p, paleta));

    const candidatos = [];
    const INTENTOS = 60;

    for (let i = 0; i < INTENTOS; i++) {
      const candidato = OutfitGenerator.generarAleatorio(prendasValidas);
      if (candidato) {
        const evaluacion = FitMeEngine.evaluarOutfitCompleto(candidato, { temperatura: tempTarget });

        const formalidadProm = parseFloat(evaluacion.desglose.formalidadPromedio);
        const cumpleFormalidad = formalidadProm >= perfilOcasion.formalidadMin && formalidadProm <= perfilOcasion.formalidadMax;

        if (evaluacion.estado !== "INCOMPATIBLE" && cumpleFormalidad) {
          candidato.evaluacion = evaluacion;
          candidato.ocasion = ocasion;
          candidato.score = evaluacion.recommendationScore;
          candidatos.push(candidato);
        }
      }
    }

    const container = document.getElementById('search-results-grid');
    if (!container) return;

    if (candidatos.length === 0) {
      container.style.display = 'block';
      container.innerHTML = `<p class="empty-msg">No se encontraron outfits que cumplan con todos los criterios de la búsqueda en tu armario actual. Intenta flexibilizar la paleta de colores o el clima.</p>`;
      return;
    }

    candidatos.sort((a, b) => b.score - a.score);
    const mejoresTres = candidatos.slice(0, 3);

    container.style.display = 'grid';
    container.innerHTML = '';

    mejoresTres.forEach((outfit, index) => {
      const card = document.createElement('div');
      card.className = 'outfit-card-saved';

      const capasHTML = outfit.prendas.map(p => `
        <div class="layer-item-mini">
          <div class="color-dot" style="background-color: ${p.colorHex || '#000'}"></div>
          <span class="layer-name">${p.nombre}</span>
          <span class="layer-cat-mini">${p.categoria}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="outfit-card-header">
          <span class="outfit-number">MATCH #${String(index + 1).padStart(2, '0')}</span>
          <span class="match-score">${outfit.score}% MATCH</span>
        </div>

        <p class="outfit-explanation-text" style="font-size: 0.75rem; margin-bottom: 8px;">
          ${outfit.evaluacion.explicacion}
        </p>

        <div class="layers-stack-saved">
          ${capasHTML}
        </div>

        <button class="btn-primary btn-save-search" data-index="${index}" style="margin-top: 8px;">
          SAVE TO LOOKBOOK
        </button>
      `;

      container.appendChild(card);

      card.querySelector('.btn-save-search').addEventListener('click', () => {
        const historial = JSON.parse(localStorage.getItem('fitme_outfits')) || [];
        historial.push(outfit);
        localStorage.setItem('fitme_outfits', JSON.stringify(historial));
        alert('¡Outfit guardado en tu Lookbook con éxito!');
        Lookbook.render();
      });
    });
  }
};

document.getElementById('btn-buscar-outfit')?.addEventListener('click', () => {
  SearchOutfitStylist.buscar();
});

// ==========================================
// 12. MÓDULO SISTEMA DE COLORES (COLOR HARMONY EXPLORER)
// ==========================================

const ColorHarmonyExplorer = {
  
  // Valida si una prenda individual pertenece al filtro de color
  evaluarPrendaEnArmonia(prenda, armonia) {
    const { hue, saturation, lightness } = prenda;

    switch (armonia) {
      case 'neutros':
        return saturation < 20 || lightness > 85 || lightness < 15;
      case 'tierra':
        return (hue >= 10 && hue <= 85) && (lightness >= 20 && lightness <= 75);
      case 'calidos':
        return (hue >= 0 && hue <= 60) || (hue >= 320 && hue <= 360);
      case 'frios':
        return hue >= 120 && hue <= 280;
      case 'alto_contraste':
        return lightness < 25 || lightness > 80;
      case 'bajo_contraste':
        return lightness >= 35 && lightness <= 65;
      default:
        return true;
    }
  },

  // Valida si un outfit completo respeta la regla cromática seleccionada
  evaluarOutfitEnArmonia(outfit, armonia) {
    const prendas = outfit.prendas;
    const noNeutros = prendas.filter(p => p.saturation > 15 && p.lightness > 15 && p.lightness < 85);
    const hues = noNeutros.map(p => p.hue);

    if (hues.length < 2) {
      return armonia === 'neutros' || armonia === 'monocromático' || armonia === 'bajo_contraste';
    }

    const maxHue = Math.max(...hues);
    const minHue = Math.min(...hues);
    const difHue = maxHue - minHue;

    switch (armonia) {
      case 'monocromático':
        return difHue <= 18;
      case 'análogos':
        return difHue > 18 && difHue <= 50;
      case 'complementarios':
        return difHue >= 140 && difHue <= 220;
      case 'alto_contraste':
        const luces = prendas.map(p => p.lightness);
        return (Math.max(...luces) - Math.min(...luces)) > 50;
      case 'bajo_contraste':
        const lucesBaja = prendas.map(p => p.lightness);
        return (Math.max(...lucesBaja) - Math.min(...lucesBaja)) <= 25;
      default:
        return prendas.every(p => this.evaluarPrendaEnArmonia(p, armonia));
    }
  },

  // Ejecuta el análisis dinámico en el armario actual
  analizar() {
    const armonia = document.getElementById('select-armonia')?.value || 'neutros';

    // 1. Filtrar prendas compatibles del armario
    const prendasCompatibles = Armario.prendas.filter(p => this.evaluarPrendaEnArmonia(p, armonia));

    // 2. Simular combinaciones posibles válidas
    let combinacionesPosibles = 0;
    const INTENTOS = 50;
    const combosUnicos = new Set();

    for (let i = 0; i < INTENTOS; i++) {
      const candidato = OutfitGenerator.generarAleatorio(Armario.prendas);
      if (candidato && this.evaluarOutfitEnArmonia(candidato, armonia)) {
        const idCombo = candidato.prendas.map(p => p.id).sort().join('-');
        combosUnicos.add(idCombo);
      }
    }
    combinacionesPosibles = combosUnicos.size;

    // 3. Evaluar coincidencia en outfits guardados en Lookbook
    const outfitsGuardados = Lookbook.obtenerGuardados();
    const guardadosCompatibles = outfitsGuardados.filter(o => this.evaluarOutfitEnArmonia(o, armonia));

    // Renderizar contadores en pantalla
    const elPrendas = document.getElementById('count-prendas-color');
    const elCombos = document.getElementById('count-combos-color');
    const elSaved = document.getElementById('count-saved-color');

    if (elPrendas) elPrendas.textContent = prendasCompatibles.length;
    if (elCombos) elCombos.textContent = combinacionesPosibles;
    if (elSaved) elSaved.textContent = guardadosCompatibles.length;

    // Renderizar tarjetas de las prendas que responden a la armonía
    const container = document.getElementById('color-prendas-preview');
    if (!container) return;

    container.innerHTML = '';

    if (prendasCompatibles.length === 0) {
      container.innerHTML = `<p class="empty-msg">No se encontraron prendas en tu colección que respondan a esta categoría de color.</p>`;
      return;
    }

    prendasCompatibles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card-prenda';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${p.nombre}</div>
          <div class="card-meta">${p.categoria.toUpperCase()}</div>
        </div>
        <div class="card-details">
          <div class="card-color-indicator" style="background-color: ${p.colorHex || '#000'}; height: 8px;"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }
};

// Evento de cambio en la selección de armonía
document.getElementById('select-armonia')?.addEventListener('change', () => {
  ColorHarmonyExplorer.analizar();
});

// Carga e inicialización global
Armario.render();
Lookbook.render();
ColorHarmonyExplorer.analizar();

// Carga e inicialización global
Armario.render();
Lookbook.render();