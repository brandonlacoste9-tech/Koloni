/**
 * Real-time Collaboration
 * Multiple users can work on campaigns together
 */

class CollaborationManager {
  constructor() {
    this.socket = null;
    this.collaborators = [];
    this.isActive = false;
    this.init();
  }

  async init() {
    await this.connectToCollaboration();
    this.setupEventListeners();
  }

  async connectToCollaboration() {
    // Connect to real-time collaboration service
    // This would use WebSockets or Supabase Realtime
    try {
      // Mock connection for now
      this.isActive = true;
      this.loadCollaborators();
    } catch (error) {
      console.error('Collaboration connection error:', error);
    }
  }

  async loadCollaborators() {
    try {
      const response = await fetch('/.netlify/functions/get-collaborators', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.collaborators = data.collaborators || [];
        this.renderCollaborators();
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  }

  renderCollaborators() {
    const container = document.getElementById('collaborators-list');
    if (!container) return;

    if (this.collaborators.length === 0) {
      container.innerHTML = `
        <div class="no-collaborators">
          <p>No collaborators yet</p>
          <button class="btn-modern btn-modern-secondary" onclick="window.collaborationManager.showInviteModal()">
            Invite Team Member
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="collaborators-header">
        <h3>Team Members</h3>
        <button class="btn-modern btn-modern-secondary" onclick="window.collaborationManager.showInviteModal()">
          + Invite
        </button>
      </div>
      <div class="collaborators-grid">
        ${this.collaborators.map(collab => `
          <div class="collaborator-card modern-card">
            <div class="collaborator-avatar">
              ${collab.avatar ? `<img src="${collab.avatar}" alt="${collab.name}">` : `<span>${collab.name.charAt(0)}</span>`}
              ${collab.isOnline ? '<span class="online-indicator"></span>' : ''}
            </div>
            <div class="collaborator-info">
              <h4>${collab.name}</h4>
              <p>${collab.role || 'Collaborator'}</p>
              ${collab.currentActivity ? `<small>${collab.currentActivity}</small>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showInviteModal() {
    // Show invite modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modern-card">
        <h2>Invite Collaborator</h2>
        <form id="invite-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="input-modern" required placeholder="colleague@example.com">
          </div>
          <div class="form-group">
            <label>Role</label>
            <select class="input-modern">
              <option>Editor</option>
              <option>Viewer</option>
              <option>Admin</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-modern btn-modern-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn-modern btn-modern-primary">Send Invite</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#invite-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      const role = e.target.querySelector('select').value;
      
      await this.sendInvite(email, role);
      modal.remove();
    });
  }

  async sendInvite(email, role) {
    try {
      const response = await fetch('/.netlify/functions/invite-collaborator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, role })
      });

      if (response.ok) {
        window.showToast('Invitation sent!', 'success');
        await this.loadCollaborators();
      }
    } catch (error) {
      window.showToast('Failed to send invitation', 'error');
    }
  }

  setupEventListeners() {
    // Listen for real-time updates
    // This would use WebSocket or Supabase Realtime
  }
}

// Initialize collaboration
document.addEventListener('DOMContentLoaded', () => {
  window.collaborationManager = new CollaborationManager();
});

