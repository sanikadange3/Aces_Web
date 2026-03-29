import { db } from '../../firebase.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Faculty card with LinkedIn link
function createFacultyCard(item) {
  const img = item.image || 'https://placehold.co/200/111827/06b6d4?text=Faculty';
  const profileLink = item.linkedinUrl
    ? `<a href="${item.linkedinUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;color:#60a5fa;font-size:0.75rem;font-weight:600;text-decoration:none;margin-top:6px;transition:color 0.2s;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        View Profile
      </a>` : '';

  return `
    <div class="glass-panel glow-border card-hover team-card" style="padding:1rem 0.75rem 1.25rem;">
      <div class="team-card-gradient" style="border-radius:24px 24px 0 0;"></div>
      <img src="${img}" alt="${item.name || ''}" class="team-avatar" style="width:100px;height:100px;margin-top:1.5rem;margin-bottom:0.75rem;" onerror="this.src='https://placehold.co/200/111827/06b6d4?text=Faculty'">
      <h4 style="color:white;font-size:0.9rem;font-weight:700;margin-bottom:4px;">${item.name || 'Faculty'}</h4>
      <p style="color:var(--accent);font-size:0.75rem;font-weight:600;">${item.designation || ''}</p>
      ${profileLink}
    </div>`;
}

// Core team card with LinkedIn/GitHub link
function createCoreCard(item) {
  const img = item.image || 'https://placehold.co/200/111827/06b6d4?text=Member';
  const profileLink = item.linkedinUrl
    ? `<a href="${item.linkedinUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:rgba(37,99,235,0.15);color:#60a5fa;font-size:0.8rem;font-weight:600;text-decoration:none;border:1px solid rgba(37,99,235,0.3);margin-top:12px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        Profile
      </a>` : '';

  return `
    <div class="glass-panel glow-border card-hover team-card" style="padding:2rem;">
      <div class="team-card-gradient" style="border-radius:24px 24px 0 0;"></div>
      <img src="${img}" alt="${item.name || ''}" class="team-avatar" style="margin-top:1rem;margin-bottom:1rem;" onerror="this.src='https://placehold.co/200/111827/06b6d4?text=Member'">
      <h3 style="color:white;font-size:1.125rem;font-weight:700;margin-bottom:4px;">${item.name || 'Member'}</h3>
      <p style="color:var(--accent);font-size:0.875rem;font-weight:600;margin-bottom:8px;">${item.position || ''}</p>
      <p style="color:var(--text-dim);font-size:0.85rem;text-align:center;">${item.description || ''}</p>
      ${profileLink}
    </div>`;
}

// Sync faculty
const facultyGrid = document.getElementById('faculty-grid');
if (facultyGrid) {
  onSnapshot(collection(db, "faculty"), (snapshot) => {
    if (snapshot.empty) {
      facultyGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No faculty members added yet.</p></div>`;
    } else {
      facultyGrid.innerHTML = snapshot.docs.map(doc => createFacultyCard(doc.data())).join('');
    }
  }, () => {
    facultyGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">Loading faculty data...</p></div>`;
  });
}

// Sync core team
const coreGrid = document.getElementById('core-grid');
if (coreGrid) {
  onSnapshot(collection(db, "coreteam"), (snapshot) => {
    if (snapshot.empty) {
      coreGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No core team members added yet.</p></div>`;
      return;
    }

    const leaders = [];
    const teamMembersMap = {}; // Maps teamName to array of members

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.members && Array.isArray(data.members)) {
        // Full Team Group
        const tName = String(data.team || '').trim().toLowerCase();
        if(!teamMembersMap[tName]) teamMembersMap[tName] = [];
        data.members.forEach(m => teamMembersMap[tName].push(m));
      } else if (data.name) {
        // Single Member / Leader
        leaders.push({ id: doc.id, ...data });
      }
    });

    if (leaders.length === 0) {
      coreGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">No core team leaders added yet.</p></div>`;
      return;
    }

    coreGrid.innerHTML = leaders.map(leader => {
      const tName = String(leader.teamCategory || '').trim().toLowerCase();
      const hasMembers = teamMembersMap[tName] && teamMembersMap[tName].length > 0;
      
      const img = leader.image || 'https://placehold.co/200/111827/06b6d4?text=Leader';
      const profileLink = leader.linkedinUrl ? `<a href="${leader.linkedinUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:rgba(37,99,235,0.15);color:#60a5fa;font-size:0.8rem;font-weight:600;text-decoration:none;border:1px solid rgba(37,99,235,0.3);margin-top:12px;width:100%;justify-content:center;transition:all 0.2s;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn</a>` : '';
      
      const viewTeamBtn = hasMembers ? `<button class="btn-primary view-team-btn" data-team="${tName}" data-displayname="${leader.teamCategory}" style="margin-top:12px; width:100%; border-radius:8px; padding:10px; font-size:0.85rem; font-weight:700; cursor:pointer;">👥 View Team</button>` : '';

      return `
      <div class="glass-panel glow-border card-hover team-card" style="padding:2rem; display:flex; flex-direction:column; align-items:center;">
        <div class="team-card-gradient" style="border-radius:24px 24px 0 0;"></div>
        <img src="${img}" alt="${leader.name || ''}" class="team-avatar" style="margin-top:1rem;margin-bottom:1rem; width:120px; height:120px; object-fit:cover; border-radius:50%; border:4px solid var(--primary);" onerror="this.src='https://placehold.co/200/111827/06b6d4?text=Leader'">
        <h3 style="color:white;font-size:1.125rem;font-weight:700;margin-bottom:4px;text-align:center;">${leader.name || 'Leader'}</h3>
        <p style="color:var(--accent);font-size:0.875rem;font-weight:600;margin-bottom:8px;text-align:center;">${leader.position || ''}</p>
        <span style="background:rgba(255,255,255,0.05); color:white; padding:4px 12px; border-radius:50px; font-size:0.75rem; margin-bottom:12px; border:1px solid rgba(255,255,255,0.1);text-align:center;">${leader.teamCategory || 'Team'}</span>
        ${profileLink}
        ${viewTeamBtn}
      </div>`;
    }).join('');

    // Attach Event Listeners to View Team Buttons
    document.querySelectorAll('.view-team-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tNameKey = e.currentTarget.getAttribute('data-team');
        const displayName = e.currentTarget.getAttribute('data-displayname');
        openTeamModal(teamMembersMap[tNameKey], displayName);
      });
    });

  }, () => {
    coreGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-dim);">Loading core team data...</p></div>`;
  });
}

function openTeamModal(members, teamName) {
  if (!members || members.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'team-modal-overlay';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:100; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s ease; padding:20px;';

  const modalContainer = document.createElement('div');
  modalContainer.className = 'team-modal-container glass-panel';
  modalContainer.style.cssText = 'background:var(--darker-bg); border:1px solid var(--glass-border); border-radius:24px; padding:32px; width:100%; max-width:900px; max-height:85vh; overflow-y:auto; position:relative; transform:scale(0.95); transition:transform 0.3s ease; box-shadow:0 20px 40px rgba(0,0,0,0.5);';

  // Modal Content
  modalContainer.innerHTML = `
    <button class="modal-close-btn" style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; width:36px; height:36px; border-radius:50%; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">&times;</button>
    <div style="text-align:center; margin-bottom:32px;">
      <h2 style="color:white; font-size:2rem; font-weight:800; margin-bottom:8px; text-transform:capitalize;">${teamName} Members</h2>
      <div style="width:60px; height:4px; background:linear-gradient(90deg, var(--primary), var(--accent)); margin:0 auto; border-radius:4px;"></div>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap:24px; justify-content:center;">
      ${members.map(m => `
        <div class="team-member-modal-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:24px; width:220px; display:flex; flex-direction:column; align-items:center; text-align:center; transition:transform 0.2s;">
          <img src="${m.photo || m.image || 'https://placehold.co/200/111827/06b6d4?text=Member'}" style="width:96px; height:96px; border-radius:50%; object-fit:cover; margin-bottom:16px; border:3px solid var(--primary);" onerror="this.src='https://placehold.co/200/111827/06b6d4?text=Member'">
          <h4 style="color:white; font-size:1.1rem; font-weight:700; margin-bottom:4px;">${m.name || 'Member'}</h4>
          ${m.position ? `<p style="color:var(--text-dim); font-size:0.85rem; margin-bottom:12px; min-height:1rem;">${m.position}</p>` : '<div style="min-height:1rem;margin-bottom:12px;"></div>'}
          ${(m.linkedin || m.linkedinUrl) ? `<a href="${m.linkedin || m.linkedinUrl}" target="_blank" rel="noopener" style="margin-top:auto; display:inline-flex; align-items:center; gap:6px; color:#0e76a8; background:rgba(14,118,168,0.1); padding:8px 16px; border-radius:50px; text-decoration:none; font-size:0.85rem; font-weight:600; width:100%; justify-content:center; border:1px solid rgba(14,118,168,0.2); transition:all 0.2s;"><svg viewBox="0 0 24 24" fill="currentColor" style="width:14px; height:14px;"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.25-.129.599-.129.949v5.418h-3.554s.047-8.733 0-9.646h3.554v1.364c.425-.654 1.186-1.586 2.882-1.586 2.105 0 3.684 1.375 3.684 4.331v5.537zM5.337 9.433c-1.144 0-1.915-.758-1.915-1.704 0-.951.77-1.703 1.964-1.703 1.192 0 1.915.752 1.94 1.703 0 .946-.748 1.704-1.989 1.704zm1.582 11.019H3.819V9.934h3.1v10.518zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg> LinkedIn</a>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  overlay.appendChild(modalContainer);
  document.body.appendChild(overlay);

  // Close functionality hover state
  const closeBtn = modalContainer.querySelector('.modal-close-btn');
  closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(239,68,68,0.8)';
  closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.05)';

  document.querySelectorAll('.team-member-modal-card').forEach(card => {
    card.onmouseover = () => card.style.transform = 'translateY(-4px)';
    card.onmouseout = () => card.style.transform = 'translateY(0)';
  });

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modalContainer.style.transform = 'scale(1)';
  });

  const closeModal = () => {
    overlay.style.opacity = '0';
    modalContainer.style.transform = 'scale(0.95)';
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeModal();
  });
}
