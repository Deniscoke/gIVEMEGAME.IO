/* ═══════════════════════════════════════════════════════════════════
   gIVEMEGAME.IO — GameUI module (extracted from script.js Phase 3.3)

   Dependencies (globals resolved at call-time, not load-time):
     • GameData       — declared in game-data.js (shared global scope)

   Exposes: window.GameUI  (also visible as global `const GameUI`)
   ═══════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────
// GameUI — Vykreslování DOM a interakce
// ─────────────────────────────────────────────────
const GameUI = (() => {

	function showScreen(name) {
		document.getElementById('welcome-screen').style.display = name === 'welcome' ? '' : 'none';
		document.getElementById('loading-screen').style.display = name === 'loading' ? '' : 'none';
		document.getElementById('game-card').style.display = name === 'game' ? '' : 'none';
	}

	// ─── Překlady nastavení ───
	const settingLabels = { indoor: 'Uvnitř', outdoor: 'Venku', any: 'Kdekoli' };

	function renderGame(game) {
		// Název
		document.getElementById('game-title').textContent = game.title;

		// Odznaky
		const badges = document.getElementById('game-badges');
		badges.innerHTML = '';
		const settingLabel = settingLabels[game.setting] || game.setting;
		addBadge(badges, settingLabel, 'setting', game.setting === 'outdoor' ? 'bi-tree' : game.setting === 'indoor' ? 'bi-house' : 'bi-globe2');
		addBadge(badges, `${game.playerCount.min}–${game.playerCount.max} hráčů`, 'players', 'bi-people');
		addBadge(badges, `${game.duration.min}–${game.duration.max} min`, 'duration', 'bi-clock');
		addBadge(badges, `Věk ${game.ageRange.min}–${game.ageRange.max}`, 'age', 'bi-person');

		// Popis
		document.getElementById('game-pitch').textContent = game.pitch;

		// Meta řádek
		const metaRow = document.getElementById('game-meta-row');
		metaRow.innerHTML = '';
		addMeta(metaRow, 'bi-people-fill', `${game.playerCount.min}–${game.playerCount.max}`, 'Hráči');
		addMeta(metaRow, 'bi-clock-fill', `${game.duration.min}–${game.duration.max}m`, 'Délka');
		addMeta(metaRow, 'bi-geo-alt-fill', settingLabel, 'Prostředí');
		addMeta(metaRow, 'bi-person-fill', `${game.ageRange.min}–${game.ageRange.max}`, 'Věk');

		// Pomůcky
		renderList('game-materials', game.materials);

		// Instrukce
		renderList('game-instructions', game.instructions);

		// Vzdělávací cíle (jako tagy)
		const goalsEl = document.getElementById('game-goals');
		goalsEl.innerHTML = '';
		game.learningGoals.forEach(g => {
			const tag = document.createElement('span');
			tag.className = 'game-tag';
			tag.textContent = g;
			goalsEl.appendChild(tag);
		});

		// RVP sekce
		renderRvpSection(game);

		// Skládací sekce
		renderList('game-reflection', game.reflectionPrompts);
		renderList('game-safety', game.safetyNotes);
		renderList('game-adaptation', game.adaptationTips);
		document.getElementById('game-facilitator').textContent = game.facilitatorNotes;

		// Reset skládacích stavů
		document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('collapsed'));

		showScreen('game');
	}

	function renderRvpSection(game) {
		const rvp = GameData.getRvp();
		const gameRvp = game.rvp;

		if (!rvp || !gameRvp) {
			const sectionEl = document.getElementById('section-rvp');
			if (sectionEl) sectionEl.innerHTML = '<p style="opacity:0.5;font-size:14px;">RVP data nejsou k dispozici</p>';
			return;
		}

		// Klíčové kompetence
		const kompEl = document.getElementById('rvp-kompetence');
		kompEl.innerHTML = '';
		(gameRvp.kompetence || []).forEach(key => {
			const def = rvp.kompetence[key];
			if (def) {
				kompEl.appendChild(createRvpBadge(def.nazev, def.ikona, def.barva));
			}
		});

		// Vzdělávací oblasti
		const oblEl = document.getElementById('rvp-oblasti');
		oblEl.innerHTML = '';
		(gameRvp.oblasti || []).forEach(key => {
			const def = rvp.vzdelavaci_oblasti[key];
			if (def) {
				oblEl.appendChild(createRvpBadge(def.nazev, def.ikona, def.barva));
			}
		});

		// Stupeň
		const stupEl = document.getElementById('rvp-stupen');
		stupEl.innerHTML = '';
		(gameRvp.stupen || []).forEach(key => {
			const def = rvp.stupne[key];
			if (def) {
				stupEl.appendChild(createRvpBadge(def.nazev, 'bi-mortarboard', '#6c757d'));
			}
		});

		// Průřezová témata
		const pruzEl = document.getElementById('rvp-prurezova');
		pruzEl.innerHTML = '';
		(gameRvp.prurezova_temata || []).forEach(key => {
			const nazev = rvp.prurezova_temata[key];
			if (nazev) {
				pruzEl.appendChild(createRvpBadge(nazev, 'bi-intersect', '#6f42c1'));
			}
		});

		// Očekávané výstupy
		renderList('rvp-vystupy', gameRvp.ocekavane_vystupy || []);

		// Doporučené hodnocení
		const hodEl = document.getElementById('rvp-hodnoceni');
		hodEl.innerHTML = '';
		const hodTypes = rvp.hodnoceni ? rvp.hodnoceni.typy : [];
		(gameRvp.doporucene_hodnoceni || []).forEach(id => {
			const typ = hodTypes.find(t => t.id === id);
			if (typ) {
				hodEl.appendChild(createRvpBadge(typ.nazev, 'bi-check-circle', '#17a2b8'));
			}
		});
	}

	function createRvpBadge(text, icon, color) {
		const span = document.createElement('span');
		span.className = 'rvp-badge';
		span.style.backgroundColor = color;
		span.style.borderColor = color;
		span.innerHTML = `<i class="bi ${icon}"></i> ${text}`;
		return span;
	}

	function addBadge(container, text, type, icon) {
		const span = document.createElement('span');
		span.className = `badge badge-${type}`;
		span.innerHTML = `<i class="bi ${icon}"></i> ${text}`;
		container.appendChild(span);
	}

	function addMeta(container, icon, value, label) {
		const div = document.createElement('div');
		div.className = 'meta-item';
		div.innerHTML = `<i class="bi ${icon} meta-icon"></i><span class="meta-value">${value}</span><span>${label}</span>`;
		container.appendChild(div);
	}

	function renderList(elementId, items) {
		const el = document.getElementById(elementId);
		if (!el) return;
		el.innerHTML = '';
		(items || []).forEach(item => {
			const li = document.createElement('li');
			li.textContent = item;
			el.appendChild(li);
		});
	}

	function renderQuickView(game) {
		const qv = document.getElementById('quick-view');
		const settingLabel = settingLabels[game.setting] || game.setting;

		// Kompetence pro náhled
		let kompText = '';
		if (game.rvp && game.rvp.kompetence) {
			const rvp = GameData.getRvp();
			if (rvp) {
				kompText = game.rvp.kompetence
					.slice(0, 3)
					.map(k => rvp.kompetence[k] ? rvp.kompetence[k].nazev : k)
					.join(', ');
			}
		}

		qv.innerHTML = `
			<div class="quick-summary">
				<strong>${game.title}</strong><br>
				<i class="bi bi-people"></i> ${game.playerCount.min}–${game.playerCount.max} &nbsp;
				<i class="bi bi-clock"></i> ${game.duration.min}–${game.duration.max}m &nbsp;
				<i class="bi bi-geo-alt"></i> ${settingLabel}<br>
				${kompText ? `<small>${kompText}</small>` : ''}
			</div>
		`;
	}

	function addToHistory(game) {
		const list = document.getElementById('history-list');
		const empty = list.querySelector('.history-empty');
		if (empty) empty.remove();

		const settingLabel = settingLabels[game.setting] || game.setting;
		const item = document.createElement('div');
		item.className = 'history-item';
		item.innerHTML = `
			<div class="history-item-title">${game.title}</div>
			<div class="history-item-meta">
				${settingLabel} · ${game.playerCount.min}–${game.playerCount.max} hráčů · ${game.duration.min}–${game.duration.max}m
			</div>
		`;
		item.addEventListener('click', () => renderGame(game));
		list.insertBefore(item, list.firstChild);
	}

	function clearHistory() {
		const list = document.getElementById('history-list');
		if (!list) return;
		list.innerHTML = '';
		const empty = document.createElement('div');
		empty.className = 'history-empty';
		empty.innerHTML = '<i class="bi bi-hourglass"></i><span data-i18n="history_empty">Vygenerované hry se zobrazí zde</span>';
		list.appendChild(empty);
	}

	function loadHistory(games) {
		clearHistory();
		const list = document.getElementById('history-list');
		const empty = list.querySelector('.history-empty');
		if (!games || games.length === 0) return;
		if (empty) empty.remove();
		games.forEach(game => addToHistory(game));
	}

	function toggleSection(sectionName) {
		const section = document.querySelector(`[data-section="${sectionName}"]`);
		if (section) section.classList.toggle('collapsed');
	}

	// ─── Vzhled ───
	function toggleTheme() {
		document.body.classList.toggle('light-mode');
		const icon = document.getElementById('theme-icon');
		if (document.body.classList.contains('light-mode')) {
			icon.className = 'bi bi-sun-fill';
		} else {
			icon.className = 'bi bi-moon-fill';
		}
	}

	// ─── Modaly ───
	function openModal(id) {
		document.getElementById(id).style.display = 'flex';
	}
	function closeModal(id) {
		document.getElementById(id).style.display = 'none';
	}
	function openHelp() { openModal('help-modal'); }

	// ─── Celá obrazovka ───
	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	function toggleHistory() {
		const rightPanel = document.querySelector('.right-panel');
		if (rightPanel) rightPanel.scrollTop = 0;
	}

	// ─── Mobile overlays ───
	function toggleMobileFilters() {
		document.body.classList.toggle('mobile-filters-open');
		if (document.body.classList.contains('mobile-filters-open')) {
			document.body.classList.remove('mobile-smarta-open');
		}
	}
	function toggleMobileSmarta() {
		document.body.classList.toggle('mobile-smarta-open');
		if (document.body.classList.contains('mobile-smarta-open')) {
			document.body.classList.remove('mobile-filters-open');
		}
	}
	function closeMobileOverlays() {
		document.body.classList.remove('mobile-filters-open', 'mobile-smarta-open');
	}

	// ─── Toast ───
	function toast(message) {
		const el = document.getElementById('toast');
		el.textContent = message;
		el.classList.add('show');
		setTimeout(() => el.classList.remove('show'), 2500);
	}

	// ─── Stav ───
	function setStatus(text) {
		document.getElementById('status-text').textContent = text;
	}

	function updateStats(generated, exported) {
		document.getElementById('stat-generated').textContent = generated;
		document.getElementById('stat-exported').textContent = exported;
	}

	// ─── Competency stats panel ───
	// Colors match rvp.json kompetence barva values exactly
	const COMP_META = {
		'k-uceni':             { label: 'K učeniu',        color: '#4A90D9', icon: 'bi-book' },
		'k-reseni-problemu':   { label: 'K riešeniu prob.', color: '#E8A838', icon: 'bi-puzzle' },
		'komunikativni':       { label: 'Komunikatívna',    color: '#50C878', icon: 'bi-chat-dots' },
		'socialni-personalni': { label: 'Sociálna',         color: '#E84C8B', icon: 'bi-people' },
		'obcanske':            { label: 'Občianska',        color: '#8B5CF6', icon: 'bi-flag' },
		'pracovni':            { label: 'Pracovná',         color: '#F97316', icon: 'bi-tools' }
	};

	function renderCompetencies(points) {
		const panel = document.getElementById('competency-panel');
		const bars  = document.getElementById('competency-bars');
		if (!bars) return;

		const allKeys = Object.keys(COMP_META);
		const hasAny  = allKeys.some(k => (points[k] || 0) > 0);

		if (!hasAny) {
			if (panel) panel.style.display = 'none';
			return;
		}
		if (panel) panel.style.display = '';

		const maxVal = Math.max(...allKeys.map(k => points[k] || 0), 1);

		bars.innerHTML = '';
		allKeys.forEach(key => {
			const val  = points[key] || 0;
			const meta = COMP_META[key];
			const pct  = Math.round((val / maxVal) * 100);

			const row = document.createElement('div');
			row.className = 'comp-row';
			row.innerHTML = `
				<div class="comp-label">
					<i class="bi ${meta.icon}" style="color:${meta.color}"></i>
					<span>${meta.label}</span>
				</div>
				<div class="comp-bar-wrap">
					<div class="comp-bar" style="width:${pct}%;background:${meta.color}"></div>
				</div>
				<span class="comp-val">${val}</span>`;
			bars.appendChild(row);
		});
	}

	return {
		showScreen, renderGame, renderQuickView, addToHistory, clearHistory, loadHistory,
		toggleSection, toggleTheme, openModal, closeModal,
		openHelp, toggleFullscreen, toggleHistory,
		toggleMobileFilters, toggleMobileSmarta, closeMobileOverlays,
		toast, setStatus, updateStats, renderCompetencies
	};
})();

// Expose globally so scripts loaded after this one can reference window.GameUI
window.GameUI = GameUI;
