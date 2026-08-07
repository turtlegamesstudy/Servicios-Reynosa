// ============================================
// Sistema de Proformas — Transporte de Personal
// ============================================

const app = {
  state: {
    cliente: "McDonald's",
    customCliente: '',
    tarifaUnica: 35,
    turnos: [],
    nextId: 1
  },

  init() {
    this.addTurno();
    this.render();
  },

  getCliente() {
    return this.state.cliente === 'Otro'
      ? (this.state.customCliente || 'Cliente')
      : this.state.cliente;
  },

  setTarifa(val) {
    this.state.tarifaUnica = val;
    document.querySelectorAll('.tqs-toggle button').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val) === val);
    });
    this.renderResumen();
  },

  updateCliente() {
    const sel = document.getElementById('cliente');
    this.state.cliente = sel.value;
    const customField = document.getElementById('custom-cliente-field');
    const customInput = document.getElementById('custom-cliente');
    if (sel.value === 'Otro') {
      customField.style.display = 'block';
      this.state.customCliente = customInput.value;
    } else {
      customField.style.display = 'none';
    }
    this.renderResumen();
  },

  addTurno() {
    const defaults = ['09:00', '10:00', '14:00', '18:00', '22:00'];
    const idx = this.state.turnos.length;
    this.state.turnos.push({
      id: this.state.nextId++,
      nombre: `Turno ${idx + 1}`,
      hora: defaults[idx % defaults.length],
      vueltas: 1,
      personas: 14
    });
    this.render();
  },

  removeTurno(id) {
    this.state.turnos = this.state.turnos.filter(t => t.id !== id);
    this.render();
  },

  updateTurno(id, field, value) {
    const t = this.state.turnos.find(t => t.id === id);
    if (!t) return;
    if (field === 'vueltas' || field === 'personas') {
      t[field] = Math.max(1, parseInt(value) || 1);
    } else {
      t[field] = value;
    }
    this.renderResumen();
  },

  calcularTurno(t) {
    if (t.vueltas === 1) {
      return {
        tipo: 'única',
        unitario: this.state.tarifaUnica,
        total: this.state.tarifaUnica
      };
    } else {
      return {
        tipo: 'múltiple',
        unitario: 20,
        total: t.vueltas * 20
      };
    }
  },

  calcularTotal() {
    return this.state.turnos.reduce((sum, t) => {
      return sum + this.calcularTurno(t).total;
    }, 0);
  },

  render() {
    const list = document.getElementById('turnos-list');
    const empty = document.getElementById('turnos-empty');

    if (this.state.turnos.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      list.innerHTML = this.state.turnos.map((t, i) => {
        const calc = this.calcularTurno(t);
        const badgeClass = calc.tipo === 'única' ? 'tqs-badge-single' : 'tqs-badge-multi';
        const badgeText = calc.tipo === 'única'
          ? 'Vuelta única'
          : `${t.vueltas} vueltas × $20`;

        return `
          <div class="tqs-turno">
            <div class="tqs-turno-header">
              <span class="tqs-turno-num">Turno #${i + 1}</span>
              <div class="tqs-turno-actions row-actions">
                <button class="tqs-btn tqs-btn-icon tqs-btn-danger" onclick="app.removeTurno(${t.id})" title="Eliminar turno">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.10001 3C8.10001 2.50294 8.50295 2.1 9.00001 2.1H15C15.4971 2.1 15.9 2.50294 15.9 3C15.9 3.49706 15.4971 3.9 15 3.9H9.00001C8.50295 3.9 8.10001 3.49706 8.10001 3Z" fill="currentColor"/>
                    <path d="M5.10001 6C5.10001 5.50294 5.50295 5.1 6.00001 5.1H18C18.4971 5.1 18.9 5.50294 18.9 6C18.9 6.49706 18.4971 6.9 18 6.9H6.00001C5.50295 6.9 5.10001 6.49706 5.10001 6Z" fill="currentColor"/>
                    <path d="M7.10001 8.99999C7.10001 8.50293 7.50295 8.09999 8.00001 8.09999C8.49707 8.09999 8.90001 8.50293 8.90001 8.99999V18C8.90001 18.4971 8.49707 18.9 8.00001 18.9C7.50295 18.9 7.10001 18.4971 7.10001 18V8.99999Z" fill="currentColor"/>
                    <path d="M12 8.09999C12.4971 8.09999 12.9 8.50293 12.9 8.99999V18C12.9 18.4971 12.4971 18.9 12 18.9C11.503 18.9 11.1 18.4971 11.1 18V8.99999C11.1 8.50293 11.503 8.09999 12 8.09999Z" fill="currentColor"/>
                    <path d="M15.1 8.99999C15.1 8.50293 15.5029 8.09999 16 8.09999C16.4971 8.09999 16.9 8.50293 16.9 8.99999V18C16.9 18.4971 16.4971 18.9 16 18.9C15.5029 18.9 15.1 18.4971 15.1 18V8.99999Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="tqs-row">
              <div class="tqs-field" style="flex:2;">
                <label>Descripción</label>
                <input type="text" value="${t.nombre}" oninput="app.updateTurno(${t.id},'nombre',this.value)">
              </div>
              <div class="tqs-field" style="min-width:90px;">
                <label>Hora salida</label>
                <input type="time" value="${t.hora}" onchange="app.updateTurno(${t.id},'hora',this.value)">
              </div>
              <div class="tqs-field" style="min-width:80px;">
                <label>Vueltas</label>
                <input type="number" min="1" value="${t.vueltas}" oninput="app.updateTurno(${t.id},'vueltas',this.value)">
              </div>
              <div class="tqs-field" style="min-width:80px;">
                <label>Personas</label>
                <input type="number" min="1" max="14" value="${t.personas}" oninput="app.updateTurno(${t.id},'personas',this.value)">
              </div>
              <div class="tqs-field" style="min-width:110px;text-align:right;">
                <label style="visibility:hidden;">.</label>
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;">
                  <span class="tqs-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-top:4px;font-variant-numeric:tabular-nums;">
                  $${calc.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    this.renderResumen();
  },

  renderResumen() {
    const body = document.getElementById('resumen-body');

    if (this.state.turnos.length === 0) {
      body.innerHTML = '<div class="tqs-empty">Agrega turnos para ver el resumen.</div>';
      return;
    }

    const filas = this.state.turnos.map((t, i) => {
      const calc = this.calcularTurno(t);
      return `
        <div class="tqs-resumen-row">
          <span>${i + 1}. ${t.nombre} — ${t.hora} (${t.vueltas} vuelta${t.vueltas > 1 ? 's' : ''}, ${t.personas} pers.)</span>
          <span style="font-variant-numeric:tabular-nums;">$${calc.total.toFixed(2)}</span>
        </div>
      `;
    }).join('');

    const total = this.calcularTotal();

    body.innerHTML = `
      <div style="margin-bottom:8px;font-size:14px;color:#555;">
        Cliente: <strong style="color:#1a1a1a;">${this.getCliente()}</strong>
        <span style="margin-left:12px;">Tarifa única:</span>
        <strong style="color:#1a1a1a;">$${this.state.tarifaUnica}</strong>
      </div>
      ${filas}
      <div class="tqs-resumen-row total">
        <span>Total estimado</span>
        <span class="tqs-amount">$${total.toFixed(2)} USD</span>
      </div>
    `;
  },

  nuevaProforma() {
    if (confirm('¿Crear una nueva proforma? Se perderán los datos actuales.')) {
      this.state.turnos = [];
      this.state.nextId = 1;
      this.state.cliente = "McDonald's";
      this.state.customCliente = '';
      document.getElementById('cliente').value = "McDonald's";
      document.getElementById('custom-cliente').value = '';
      document.getElementById('custom-cliente-field').style.display = 'none';
      this.setTarifa(35);
      this.addTurno();
    }
  },

  copiarResumen() {
    const lineas = [];
    lineas.push(`PROFORMA — Transporte de personal`);
    lineas.push(`Cliente: ${this.getCliente()}`);
    lineas.push(`Fecha: ${new Date().toLocaleDateString('es-NI')}`);
    lineas.push('');

    this.state.turnos.forEach((t, i) => {
      const calc = this.calcularTurno(t);
      lineas.push(
        `${i + 1}. ${t.nombre} | Salida: ${t.hora} | Vueltas: ${t.vueltas} | Personas: ${t.personas} | $${calc.total.toFixed(2)}`
      );
    });

    lineas.push('');
    lineas.push(`TOTAL: $${this.calcularTotal().toFixed(2)} USD`);

    navigator.clipboard.writeText(lineas.join('\n')).then(() => {
      alert('Resumen copiado al portapapeles');
    });
  },

  imprimir() {
    const out = document.getElementById('tqs-print-output');
    const total = this.calcularTotal();

    let html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="font-size:22px;font-weight:600;margin-bottom:4px;">Proforma de servicio de transporte</h2>
        <p style="font-size:14px;color:#666;margin-bottom:20px;">
          Cliente: <strong>${this.getCliente()}</strong>
          &nbsp;|&nbsp;
          Fecha: ${new Date().toLocaleDateString('es-NI')}
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="border-bottom:2px solid #333;">
              <th style="text-align:left;padding:8px;">#</th>
              <th style="text-align:left;padding:8px;">Turno / Descripción</th>
              <th style="text-align:left;padding:8px;">Hora</th>
              <th style="text-align:center;padding:8px;">Vueltas</th>
              <th style="text-align:center;padding:8px;">Personas</th>
              <th style="text-align:right;padding:8px;">Tarifa</th>
              <th style="text-align:right;padding:8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.state.turnos.forEach((t, i) => {
      const calc = this.calcularTurno(t);
      html += `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:8px;">${i + 1}</td>
          <td style="padding:8px;">${t.nombre}</td>
          <td style="padding:8px;">${t.hora}</td>
          <td style="padding:8px;text-align:center;">${t.vueltas}</td>
          <td style="padding:8px;text-align:center;">${t.personas}</td>
          <td style="padding:8px;text-align:right;">$${calc.unitario.toFixed(2)}</td>
          <td style="padding:8px;text-align:right;font-weight:600;">$${calc.total.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:18px;font-weight:600;">
          Total: $${total.toFixed(2)} USD
        </div>
        <div style="margin-top:32px;font-size:12px;color:#888;">
          Notas: Tarifa de vuelta única $${this.state.tarifaUnica} (hasta 14 personas). Vueltas múltiples a $20 c/u.
        </div>
      </div>
    `;

    out.innerHTML = html;
    window.print();
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
