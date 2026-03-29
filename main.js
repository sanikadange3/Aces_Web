import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, onSnapshot, addDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const ADMIN_EMAILS = ["admin@acesrscoe.com"];
const isAdminEmail = (email) => typeof email === 'string' && ADMIN_EMAILS.includes(email.toLowerCase());

// === NAVBAR SCROLL ===
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// === MOBILE MENU ===
const hamburger = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileOverlay = document.getElementById('mobile-overlay');
const mobileClose = document.getElementById('mobile-close');
function openMobile() { mobileMenu?.classList.add('open'); mobileOverlay?.classList.add('open'); }
function closeMobile() { mobileMenu?.classList.remove('open'); mobileOverlay?.classList.remove('open'); }
hamburger?.addEventListener('click', openMobile);
mobileClose?.addEventListener('click', closeMobile);
mobileOverlay?.addEventListener('click', closeMobile);
document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', closeMobile));

// === AUTH UI ===
const authSection = document.getElementById('auth-section');
if (authSection) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = isAdminEmail(user.email);
      authSection.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="color:#06b6d4;font-size:0.85rem;font-weight:600;">Hi, ${user.displayName || 'Admin'}</span>
          ${isAdmin ? '<a href="admin.html" class="nav-cta" style="padding:8px 16px;font-size:0.8rem;">Dashboard</a>' : ''}
          <button id="logout-btn" class="nav-cta" style="padding:8px 16px;font-size:0.8rem;background:#374151;">Logout</button>
        </div>`;
      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try { await signOut(auth); window.location.reload(); } catch (e) { console.error(e); }
      });
    } else {
      authSection.innerHTML = `<a href="login.html" class="nav-cta">Admin Login</a>`;
    }
  });
}

// === EVENT DELEGATION ===
document.addEventListener('click', (e) => {
  if (e.target.matches('.btn-read-more')) {
    e.target.previousElementSibling.style.display = 'inline';
    e.target.style.display = 'none';
  }
});

// === CARD BUILDERS (with links/redirections) ===

function createEventCard(item) {
  const img = item.image || 'https://placehold.co/400x320/070b14/06b6d4?text=Event';
  const regLink = item.registerUrl ? `<a href="${item.registerUrl}" target="_blank" rel="noopener" class="btn-primary" style="margin-top:12px;padding:10px 20px;font-size:0.85rem;display:inline-flex;">Register Now →</a>` : '';
  const readMore = item.description && item.description.length > 120
    ? `<span class="read-more-text" style="display:none;">${item.description.substring(120)}</span><button class="btn-read-more" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:600;font-size:0.85rem;margin-left:4px;">Read More</button>`
    : '';

  return `
    <div class="glass-panel glow-border card-hover" style="overflow:hidden;padding:0;cursor:default;">
      <div style="height:320px;overflow:hidden;">
        <img src="${img}" alt="${item.title || ''}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.7s;" onerror="this.src='https://placehold.co/400x320/070b14/06b6d4?text=ACES'">
      </div>
      <div style="padding:24px;">
        ${item.isFeatured ? '<span style="background:rgba(6,182,212,0.2);color:var(--accent);padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:700;margin-bottom:8px;display:inline-block;">⭐ Featured</span>' : ''}
        <h3 style="color:white;font-size:1.25rem;font-weight:700;margin-bottom:8px;">${item.title || 'Untitled'}</h3>
        ${item.date ? `<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:6px;">📅 ${item.date}</p>` : ''}
        <p style="color:var(--text-dim);font-size:0.9rem;line-height:1.6;">${(item.description || '').substring(0, 120)}${readMore}</p>
        ${regLink}
      </div>
    </div>`;
}

function createAchievementCard(item) {
  const img = item.image || 'https://placehold.co/400x380/070b14/06b6d4?text=Achievement';
  const wrapper = item.linkedinUrl ? `<a href="${item.linkedinUrl}" target="_blank" rel="noopener" style="text-decoration:none;display:block;">` : '<div>';
  const wrapperEnd = item.linkedinUrl ? '</a>' : '</div>';
  const categoryColors = { 'Innovation': '#06b6d4', 'Sports': '#22c55e', 'Art & Culture': '#f472b6', 'Academic': '#a78bfa', 'Technical': '#f59e0b' };
  const catColor = categoryColors[item.category] || '#06b6d4';

  return `
    ${wrapper}
    <div class="glass-panel glow-border card-hover" style="overflow:hidden;padding:3px;cursor:pointer;">
      <div style="height:380px;border-radius:20px;position:relative;overflow:hidden;">
        <img src="${img}" alt="${item.title || ''}" style="width:100%;height:100%;object-fit:cover;border-radius:20px;" onerror="this.src='https://placehold.co/400x380/070b14/06b6d4?text=ACES'">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.4) 40%,transparent);border-radius:20px;"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px;">
          ${item.category ? `<span style="font-size:0.7rem;font-weight:700;padding:4px 12px;border-radius:50px;border:1px solid ${catColor};color:${catColor};margin-bottom:8px;display:inline-block;">${item.category}</span>` : ''}
          <div style="border-left:4px solid var(--accent);padding-left:16px;">
            <p style="font-size:0.95rem;font-weight:700;color:white;line-height:1.5;">${item.title || item.description || ''}</p>
            ${item.studentName ? `<p style="color:var(--accent);font-size:0.85rem;margin-top:4px;">${item.studentName}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
    ${wrapperEnd}`;
}

function createPlacementCard(item, featured = false) {
  const img = item.image || 'https://placehold.co/200/111827/06b6d4?text=Student';
  const linkedinBtn = item.linkedinUrl
    ? `<a href="${item.linkedinUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:rgba(37,99,235,0.15);color:#60a5fa;font-size:0.8rem;font-weight:600;text-decoration:none;border:1px solid rgba(37,99,235,0.3);margin-top:12px;transition:all 0.3s;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        LinkedIn
      </a>` : '';

  if (featured) {
    return `
      <div class="glass-panel glow-border card-hover placement-card" style="padding:2rem;position:relative;">
        <div style="position:absolute;top:0;left:0;width:100%;height:96px;background:linear-gradient(135deg,rgba(37,99,235,0.25),rgba(6,182,212,0.15));z-index:0;border-radius:24px 24px 0 0;"></div>
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;">
          <img src="${img}" alt="${item.studentName || ''}" class="placement-img" style="margin-bottom:1.25rem;" onerror="this.src='https://placehold.co/200/111827/06b6d4?text=Student'">
          <h3 style="font-size:1.25rem;font-weight:700;color:white;margin-bottom:4px;">${item.studentName || ''}</h3>
          ${item.batch ? `<span style="color:var(--text-muted);font-size:0.8rem;">Batch ${item.batch}</span>` : ''}
          <div style="display:flex;flex-direction:column;gap:8px;width:100%;border-top:1px solid var(--glass-border);padding-top:1rem;margin-top:1rem;align-items:center;">
            <span style="font-weight:600;color:var(--text-dim);">${item.company || ''}</span>
            <span style="color:var(--accent);font-weight:800;font-size:1.25rem;">${item.ctc || ''}</span>
          </div>
          ${linkedinBtn}
        </div>
      </div>`;
  }

  return `
    <div class="glass-panel glow-border card-hover" style="padding:1.25rem;display:flex;align-items:center;gap:1rem;">
      <img src="${img}" alt="${item.studentName || ''}" class="placement-sm-img" onerror="this.src='https://placehold.co/100/111827/06b6d4?text=S'">
      <div style="flex:1;min-width:0;">
        <h4 style="color:white;font-weight:600;font-size:0.95rem;">${item.studentName || ''}</h4>
        <p style="color:var(--text-dim);font-size:0.85rem;">${item.company || ''}</p>
        ${item.ctc ? `<p style="color:var(--accent);font-weight:700;font-size:0.85rem;">${item.ctc}</p>` : ''}
      </div>
      ${item.linkedinUrl ? `<a href="${item.linkedinUrl}" target="_blank" rel="noopener" style="color:#60a5fa;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>` : ''}
    </div>`;
}

function createClubCard(item) {
  const img = item.image || 'https://placehold.co/400x224/070b14/06b6d4?text=Club';
  const websiteBtn = item.websiteUrl
    ? `<a href="${item.websiteUrl}" target="_blank" rel="noopener" class="btn-outline" style="margin-top:auto;font-size:0.8rem;padding:8px 16px;">Visit Website →</a>` : '';

  return `
    <div class="glass-panel glow-border card-hover" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
      <div style="height:224px;overflow:hidden;position:relative;">
        <img src="${img}" alt="${item.name || ''}" class="club-card-img" onerror="this.src='https://placehold.co/400x224/070b14/06b6d4?text=Club'">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,#0d1527,transparent 50%);opacity:0.8;"></div>
      </div>
      <div style="padding:24px;flex:1;display:flex;flex-direction:column;">
        <h3 style="font-size:1.125rem;font-weight:700;color:white;margin-bottom:8px;">${item.name || ''}</h3>
        ${item.lead ? `<p style="color:var(--accent);font-size:0.85rem;margin-bottom:6px;">Lead: ${item.lead}</p>` : ''}
        <p style="color:var(--text-dim);font-size:0.875rem;flex:1;line-height:1.6;margin-bottom:12px;">${(item.description || '').substring(0, 120)}${(item.description || '').length > 120 ? '...' : ''}</p>
        ${websiteBtn}
      </div>
    </div>`;
}

// === SYNC COLLECTIONS ===
function syncCollection(collName, gridId, cardFn, limitCount = 50) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const q = query(collection(db, collName), limit(limitCount));
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No ${collName} to display yet.</p></div>`;
    } else {
      grid.innerHTML = snapshot.docs.map(d => cardFn(d.data())).join('');
    }
  }, (err) => {
    console.error(`Error loading ${collName}:`, err);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">Loading ${collName}...</p></div>`;
  });
}

// Home page: limited items with "View All" links
if (document.getElementById('events-grid')) syncCollection('events', 'events-grid', createEventCard, 3);
if (document.getElementById('achievements-grid')) syncCollection('achievements', 'achievements-grid', createAchievementCard, 4);

// Placements on home - featured only
const placementsHomeGrid = document.getElementById('placements-grid');
if (placementsHomeGrid && !window.location.pathname.includes('placements')) {
  onSnapshot(query(collection(db, 'placements'), limit(4)), (snap) => {
    if (snap.empty) {
      placementsHomeGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No placements yet.</p></div>`;
    } else {
      placementsHomeGrid.innerHTML = snap.docs.map(d => createPlacementCard(d.data(), true)).join('');
    }
  });
}

if (document.getElementById('clubs-grid')) syncCollection('clubs', 'clubs-grid', createClubCard, 8);

// Full placements page
const placementsFullGrid = document.getElementById('placements-full-grid');
if (placementsFullGrid) {
  onSnapshot(collection(db, 'placements'), (snap) => {
    if (snap.empty) {
      placementsFullGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No placements yet.</p></div>`;
    } else {
      const featured = snap.docs.filter(d => d.data().isFeatured).map(d => d.data());
      const others = snap.docs.filter(d => !d.data().isFeatured).map(d => d.data());

      let html = '';
      if (featured.length) {
        html += `<div style="grid-column:1/-1;margin-bottom:1rem;">
          <h3 style="font-size:1.5rem;font-weight:700;color:white;margin-bottom:1.5rem;">⭐ Top Placements</h3>
          <div class="cards-grid" style="max-width:700px;">${featured.map(p => createPlacementCard(p, true)).join('')}</div>
        </div>`;
      }
      if (others.length) {
        html += `<div style="grid-column:1/-1;margin-top:2rem;">
          <h3 style="font-size:1.5rem;font-weight:700;color:white;margin-bottom:1.5rem;">More Placed Students</h3>
          <div class="cards-grid-5" style="display:grid;gap:1rem;">${others.map(p => createPlacementCard(p, false)).join('')}</div>
        </div>`;
      }
      placementsFullGrid.innerHTML = html;
    }
  });
}

// === CONTACT FORM ===
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('form-msg');
    const formData = {
      name: document.getElementById('contact-name').value,
      email: document.getElementById('contact-email').value,
      message: document.getElementById('contact-message').value,
      timestamp: new Date()
    };
    try {
      await addDoc(collection(db, "queries"), formData);
      msgDiv.style.color = "#00ff88";
      msgDiv.textContent = "Message sent successfully!";
      contactForm.reset();
    } catch (error) {
      msgDiv.style.color = "#ff4c4c";
      msgDiv.textContent = "Error sending message.";
      console.error(error);
    }
  });
}
