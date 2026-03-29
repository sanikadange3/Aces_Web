/**
 * ACES Admin Dashboard - Consolidated Main Script
 * Handles: Authentication, Form Management, Content CRUD, Contact Submissions
 */

import { auth, db } from '../../firebase.js';
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ========== CONFIGURATION ==========
const ADMIN_EMAILS = ["admin@acesrscoe.com"];

// ========== UTILITIES ==========
const isAdminEmail = (email) => 
  typeof email === 'string' && ADMIN_EMAILS.includes(email.toLowerCase());

let editState = {};

// ========== AUTHENTICATION ==========
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (!isAdminEmail(user.email)) {
      alert("Access Denied: Not authorized as admin.");
      window.location.href = 'index.html';
    }
  } else {
    window.location.href = 'login.html';
  }
});

// Admin Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try { 
    await signOut(auth); 
    window.location.href = 'login.html'; 
  } catch (e) { 
    console.error('Logout error:', e); 
  }
});

// ========== FORM CONFIGURATION ==========
const formMappings = {
  'events': { 
    formId: 'add-event-form', 
    map: {
      'event-title': 'title', 
      'event-date': 'date', 
      'event-image': 'image',
      'event-desc': 'description', 
      'event-register-url': 'registerUrl', 
      'event-featured': 'isFeatured'
    }
  },
  'achievements': { 
    formId: 'add-achievement-form', 
    map: {
      'ach-title': 'title', 
      'ach-student': 'studentName', 
      'ach-image': 'image',
      'ach-desc': 'description', 
      'ach-category': 'category', 
      'ach-link': 'linkedinUrl'
    }
  },
  'placements': { 
    formId: 'add-placement-form', 
    map: {
      'place-student': 'studentName', 
      'place-company': 'company', 
      'place-ctc': 'ctc',
      'place-image': 'image', 
      'place-batch': 'batch', 
      'place-linkedin': 'linkedinUrl', 
      'place-featured': 'isFeatured'
    }
  },
  'clubs': { 
    formId: 'add-club-form', 
    map: {
      'club-name': 'name', 
      'club-lead': 'lead', 
      'club-image': 'image',
      'club-desc': 'description', 
      'club-website': 'websiteUrl'
    }
  },
  'faculty': { 
    formId: 'add-faculty-form', 
    map: {
      'fac-name': 'name', 
      'fac-designation': 'designation', 
      'fac-image': 'image', 
      'fac-linkedin': 'linkedinUrl'
    }
  },
  'coreteam': { 
    formId: 'add-coreteam-form', 
    map: {
      'core-name': 'name', 
      'core-position': 'position', 
      'core-team': 'teamCategory',
      'core-image': 'image',
      'core-linkedin': 'linkedinUrl'
    }
  }
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map(part => part[0].toUpperCase()).join('') : 'TM';
};

// ========== IMAGE COMPRESSION ==========
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { 
          h = Math.round(h * maxWidth / w); 
          w = maxWidth; 
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ========== FORM HANDLER ==========
const setupForm = (collName) => {
  const { formId, map: fieldMap } = formMappings[collName];
  const form = document.getElementById(formId);
  if (!form) return console.warn(`Form ${formId} not found`);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { updatedAt: new Date() };
    const isEdit = !!editState[collName];
    if (!isEdit) data.createdAt = new Date();

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.disabled = true;

    try {
      for (const [id, key] of Object.entries(fieldMap)) {
        const el = document.getElementById(id);
        if (!el) continue;
        
        if (el.type === 'file' && el.files.length > 0) {
          btn.textContent = 'Compressing image...';
          data[key] = await compressImage(el.files[0]);
        } else if (el.type === 'checkbox') {
          data[key] = el.checked;
        } else if (el.type !== 'file' && el.value?.trim?.()) {
          data[key] = el.value.trim();
        }
      }

      btn.textContent = "Saving...";
      if (isEdit) {
        await updateDoc(doc(db, collName, editState[collName]), data);
        editState[collName] = null;
        btn.textContent = "Updated ✅";
      } else {
        await addDoc(collection(db, collName), data);
        btn.textContent = "Saved ✅";
      }
      
      setTimeout(() => { 
        btn.textContent = oldText; 
        btn.disabled = false; 
        form.reset(); 
      }, 2000);
    } catch (err) {
      console.error('Form submission error:', err);
      alert("Error: " + err.message);
      btn.textContent = "Try Again";
      btn.disabled = false;
    }
  });
};

// Initialize all form handlers
Object.keys(formMappings).forEach(coll => setupForm(coll));

// ========== CONTACT SUBMISSIONS ==========
const renderContacts = () => {
  const table = document.getElementById('contact-submissions');
  if (!table) return console.warn('Contact table not found');
  
  const q = query(collection(db, "queries"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">No messages yet.</td></tr>`;
    } else {
      table.innerHTML = snap.docs.map(d => {
        const data = d.data();
        const time = data.timestamp?.toDate 
          ? data.timestamp.toDate().toLocaleString() 
          : 'N/A';
        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:12px 16px;">${data.name || '-'}</td>
          <td style="padding:12px 16px;color:var(--accent);">${data.email || '-'}</td>
          <td style="padding:12px 16px;max-width:300px;word-wrap:break-word;">${data.message || '-'}</td>
          <td style="padding:12px 16px;color:rgba(255,255,255,0.4);font-size:0.8rem;">${time}</td>
        </tr>`;
      }).join('');
    }
  }, (err) => {
    console.error('Contact fetch error:', err);
    table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#ef4444;">Error loading contacts</td></tr>`;
  });
};

// ========== VIEW TEAM ==========
const renderTeamView = () => {
  const container = document.getElementById('team-groups-container');
  if (!container) return console.warn('Team groups container not found');
  
  const q = query(collection(db, "coreteam"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      container.innerHTML = `<div class="team-view-state">No team members added yet.</div>`;
      return;
    }
    
    const grouped = {};
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.members && Array.isArray(data.members)) {
        // Full Team Group Format
        const teamName = String(data.team || 'Other Team').trim();
        if (!grouped[teamName]) grouped[teamName] = [];
        data.members.forEach((m, idx) => {
          grouped[teamName].push({
            id: `${d.id}-${idx}`,
            name: m.name,
            position: m.position || 'Team Member',
            image: m.photo || m.image || null,
            linkedinUrl: m.linkedin || m.linkedinUrl || null,
            isGrouped: true,
            parentId: d.id
          });
        });
      } else {
        // Individual Member Format
        const team = String(data.teamCategory || 'Other Team').trim() || 'Other Team';
        if (!grouped[team]) grouped[team] = [];
        grouped[team].push({ id: d.id, ...data });
      }
    });
    
    const orderedGroups = Object.entries(grouped)
      .sort(([teamA], [teamB]) => teamA.localeCompare(teamB))
      .map(([team, members]) => [
        team,
        members.sort((memberA, memberB) => String(memberA.name || '').localeCompare(String(memberB.name || '')))
      ]);
    
    container.innerHTML = orderedGroups.map(([team, members]) => `
      <section class="team-group" style="padding: 24px; background: rgba(255,255,255,0.02); border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05);">
        <div class="team-group-header" style="margin-bottom: 20px; display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
          <h4 class="team-group-title" style="color:white; font-size:1.4rem; margin:0;">${escapeHtml(team)}</h4>
          <span class="team-group-count" style="color:var(--accent); font-weight:600;">${members.length} member${members.length === 1 ? '' : 's'}</span>
        </div>
        <div class="team-members-grid" style="display:flex; flex-wrap:wrap; gap:20px;">
          ${members.map(member => `
            <div class="team-member-card" style="width:200px; min-height:240px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:20px; text-align:center; display:flex; flex-direction:column; align-items:center;">
              ${member.image
                ? `<img src="${member.image}" alt="${escapeHtml(member.name || 'Team member')}" class="team-member-photo" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:12px; border:3px solid var(--primary);">`
                : `<div class="team-member-photo-placeholder" style="width:100px; height:100px; border-radius:50%; background:rgba(37,99,235,0.1); display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:2rem; font-weight:700; margin-bottom:12px; border:3px solid var(--primary);">${escapeHtml(getInitials(member.name))}</div>`}
              <div class="team-member-info" style="width:100%;">
                <h5 class="team-member-name" style="color:white; font-size:1.1rem; margin:0 0 4px 0;">${escapeHtml(member.name || 'Unnamed Member')}</h5>
                <p class="team-member-position" style="color:var(--text-dim); font-size:0.85rem; margin:0 0 12px 0;">${escapeHtml(member.position || 'Team Member')}</p>
                ${member.linkedinUrl ? `<a href="${member.linkedinUrl}" target="_blank" rel="noopener noreferrer" class="team-member-linkedin" aria-label="Open ${escapeHtml(member.name || 'team member')} LinkedIn profile" style="display:inline-flex; align-items:center; gap:6px; color:#0e76a8; background:rgba(14,118,168,0.1); padding:6px 12px; border-radius:50px; text-decoration:none; font-size:0.85rem; font-weight:600; transition:all 0.2s;">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:14px; height:14px;"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.25-.129.599-.129.949v5.418h-3.554s.047-8.733 0-9.646h3.554v1.364c.425-.654 1.186-1.586 2.882-1.586 2.105 0 3.684 1.375 3.684 4.331v5.537zM5.337 9.433c-1.144 0-1.915-.758-1.915-1.704 0-.951.77-1.703 1.964-1.703 1.192 0 1.915.752 1.94 1.703 0 .946-.748 1.704-1.989 1.704zm1.582 11.019H3.819V9.934h3.1v10.518zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
                  <span>LinkedIn</span>
                </a>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `).join('');
  }, (err) => {
    console.error('Team view error:', err);
    container.innerHTML = `<div class="team-view-state team-view-state-error">Error loading team members.</div>`;
  });
};

// ========== DELETE CONTENT ==========
const deleteContent = async (coll, id) => {
  if (!confirm("Delete this item permanently?")) return;
  
  try { 
    await deleteDoc(doc(db, coll, id)); 
  } catch (e) { 
    alert("Delete failed: " + e.message);
    console.error('Delete error:', e);
  }
};

// ========== EDIT CONTENT ==========
const editContent = async (coll, id) => {
  try {
    const docSnap = await getDoc(doc(db, coll, id));
    if (!docSnap.exists()) {
      alert("Document not found");
      return;
    }
    
    const data = docSnap.data();
    const { formId, map: fieldMap } = formMappings[coll];

    for (const [domId, key] of Object.entries(fieldMap)) {
      const el = document.getElementById(domId);
      if (!el) continue;
      
      if (el.type === 'checkbox') {
        el.checked = !!data[key];
      } else if (el.type !== 'file' && data[key]) {
        el.value = data[key];
      }
    }

    editState[coll] = id;
    const form = document.getElementById(formId);
    if (form) {
      form.querySelector('button[type="submit"]').textContent = "Update Changes";
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (error) { 
    alert("Error loading item: " + error.message);
    console.error("Edit error:", error); 
  }
};

// ========== MANAGE CONTENT LIST ==========
const renderManagement = () => {
  const list = document.getElementById('manage-list');
  if (!list) return console.warn('Manage list not found');
  
  Object.keys(formMappings).forEach(coll => {
    onSnapshot(collection(db, coll), (snap) => {
      // Remove old items for this collection
      document.querySelectorAll(`.${coll}-item-row`).forEach(el => el.remove());
      
      // Add new items
      snap.forEach(docSnap => {
        const item = docSnap.data();
        const display = item.title || item.name || item.studentName || 'Untitled';
        const row = document.createElement('div');
        row.className = `${coll}-item-row`;
        row.style.cssText = `
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 16px;background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.05);border-radius:8px;
          margin-bottom:8px;
        `;
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
            <span style="background:rgba(37,99,235,0.2);color:var(--primary);padding:4px 8px;border-radius:4px;font-size:0.7rem;font-weight:700;text-transform:uppercase;white-space:nowrap;">${coll}</span>
            <span style="color:white;font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${display}</span>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="btn-edit-content" data-coll="${coll}" data-id="${docSnap.id}" style="background:rgba(6,182,212,0.1);color:#06b6d4;border:1px solid rgba(6,182,212,0.2);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;transition:all 0.2s;">Edit</button>
            <button class="btn-delete-content" data-coll="${coll}" data-id="${docSnap.id}" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;transition:all 0.2s;">Delete</button>
          </div>
        `;
        list.appendChild(row);
      });
    }, (err) => {
      console.error(`Error loading ${coll}:`, err);
    });
  });
};

document.addEventListener('click', (e) => {
  if (e.target.matches('.btn-edit-content')) {
    editContent(e.target.dataset.coll, e.target.dataset.id);
  }
  if (e.target.matches('.btn-delete-content')) {
    deleteContent(e.target.dataset.coll, e.target.dataset.id);
  }
});

// ========== DASHBOARD COUNTS ==========
const updateDashboardCounts = () => {
  // Events count
  onSnapshot(collection(db, "events"), (snap) => {
    document.getElementById('count-events').textContent = snap.size;
  }, (err) => console.error('Events count error:', err));
  
  // Achievements count
  onSnapshot(collection(db, "achievements"), (snap) => {
    document.getElementById('count-achievements').textContent = snap.size;
  }, (err) => console.error('Achievements count error:', err));
  
  // Placements count
  onSnapshot(collection(db, "placements"), (snap) => {
    document.getElementById('count-placements').textContent = snap.size;
  }, (err) => console.error('Placements count error:', err));
  
  // Contacts count
  onSnapshot(collection(db, "queries"), (snap) => {
    document.getElementById('count-contacts').textContent = snap.size;
  }, (err) => console.error('Contacts count error:', err));
};

// ========== FULL TEAM GROUP UPLOAD HANDLER ==========
const initFullTeamForm = () => {
  const btnShowToggle = document.getElementById('btn-show-add-team');
  const btnCancelToggle = document.getElementById('btn-cancel-add-team');
  const singleForm = document.getElementById('add-coreteam-form');
  const teamForm = document.getElementById('add-full-team-form');
  const addRowBtn = document.getElementById('btn-add-member-row');
  const membersContainer = document.getElementById('team-members-container');

  if (!teamForm) return;

  // Toggle Forms
  btnShowToggle?.addEventListener('click', () => {
    singleForm.style.display = 'none';
    teamForm.style.display = 'flex';
  });
  
  btnCancelToggle?.addEventListener('click', () => {
    teamForm.style.display = 'none';
    singleForm.style.display = 'flex';
  });

  const generateMemberRow = () => {
    const row = document.createElement('div');
    row.className = 'team-member-input-row';
    row.style.cssText = 'display:flex; flex-direction:column; gap:8px; padding:16px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px; position:relative;';
    
    row.innerHTML = `
      <button type="button" class="btn-remove-row" style="position:absolute; top:12px; right:12px; background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:1.2rem;" title="Remove Member">&times;</button>
      <input type="text" class="m-name" placeholder="Member Name *" required>
      <input type="text" class="m-position" placeholder="Position (optional)">
      <label style="color:var(--text-dim);font-size:0.8rem;margin-top:4px;">Photo (.png, .jpg)</label>
      <input type="file" class="m-photo" accept=".png,.jpg,.jpeg">
      <input type="url" class="m-linkedin" placeholder="LinkedIn URL (optional)">
    `;
    
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
    });
    
    membersContainer.appendChild(row);
  };

  addRowBtn?.addEventListener('click', generateMemberRow);

  // Auto-init one row
  if(membersContainer && membersContainer.children.length === 0) {
    generateMemberRow();
  }

  // Submit Handler
  teamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = teamForm.querySelector('button[type="submit"]');
    const oldText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Processing...";

    try {
      const teamName = document.getElementById('full-team-name').value.trim();
      if(!teamName) throw new Error("Team Name is required.");

      const rows = membersContainer.querySelectorAll('.team-member-input-row');
      if(rows.length === 0) throw new Error("At least one member is required.");

      const members = [];
      btnSubmit.textContent = "Compressing images...";

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const mName = row.querySelector('.m-name').value.trim();
        const mPos = row.querySelector('.m-position').value.trim();
        const mLinked = row.querySelector('.m-linkedin').value.trim();
        const mFile = row.querySelector('.m-photo').files[0];

        let mPhotoUrl = null;
        if (mFile) {
          mPhotoUrl = await compressImage(mFile);
        }

        members.push({
          name: mName,
          position: mPos,
          photo: mPhotoUrl,
          linkedin: mLinked
        });
      }

      btnSubmit.textContent = "Saving Team...";
      const newDoc = {
        team: teamName,
        members: members,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, "coreteam"), newDoc);

      btnSubmit.textContent = "Saved ✅";
      setTimeout(() => {
        teamForm.reset();
        membersContainer.innerHTML = '';
        generateMemberRow();
        btnSubmit.textContent = oldText;
        btnSubmit.disabled = false;
        btnCancelToggle.click(); // go back to single form view
      }, 2000);

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      btnSubmit.textContent = "Try Again";
      btnSubmit.disabled = false;
    }
  });
};

// ========== INITIALIZE ==========
updateDashboardCounts();
renderContacts();
renderManagement();
renderTeamView();
initFullTeamForm();
