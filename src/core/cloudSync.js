/**
 * Cloud Sync v2.0
 * Synchronize projects with cloud storage
 */

class CloudSync {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.syncStatus = 'disconnected'; // 'disconnected', 'connected', 'syncing', 'error'
    this.lastSyncTime = null;
  }

  /**
   * Register a cloud storage provider
   */
  registerProvider(provider) {
    if (!provider.id || !provider.name) {
      throw new Error('Provider must have id and name');
    }

    const validatedProvider = {
      id: provider.id,
      name: provider.name,
      description: provider.description || '',
      icon: provider.icon || '☁️',
      initialize: provider.initialize || (() => Promise.resolve()),
      connect: provider.connect || (() => Promise.reject(new Error('Not implemented'))),
      disconnect: provider.disconnect || (() => Promise.resolve()),
      saveProject: provider.saveProject || (() => Promise.reject(new Error('Not implemented'))),
      loadProject: provider.loadProject || (() => Promise.reject(new Error('Not implemented'))),
      listProjects: provider.listProjects || (() => Promise.reject(new Error('Not implemented'))),
      deleteProject: provider.deleteProject || (() => Promise.reject(new Error('Not implemented'))),
      config: provider.config || {},
    };

    this.providers.set(provider.id, validatedProvider);
    console.log(`Cloud provider ${provider.id} registered`);
  }

  /**
   * Get available providers
   */
  getProviders() {
    return Array.from(this.providers.values());
  }

  /**
   * Set active provider and connect
   */
  async setActiveProvider(providerId, config = {}) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    try {
      this.syncStatus = 'connecting';
      await provider.initialize(config);
      await provider.connect(config);

      this.activeProvider = {
        ...provider,
        config: { ...provider.config, ...config },
      };

      this.syncStatus = 'connected';
      console.log(`Connected to ${provider.name}`);

      return true;
    } catch (error) {
      this.syncStatus = 'error';
      console.error('Error connecting to provider:', error);
      throw error;
    }
  }

  /**
   * Disconnect from active provider
   */
  async disconnect() {
    if (!this.activeProvider) return;

    try {
      await this.activeProvider.disconnect();
      this.activeProvider = null;
      this.syncStatus = 'disconnected';
      console.log('Disconnected from cloud provider');
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Save project to cloud
   */
  async saveProject(projectData) {
    if (!this.activeProvider) {
      throw new Error('No active cloud provider');
    }

    try {
      this.syncStatus = 'syncing';

      const savedProject = await this.activeProvider.saveProject({
        ...projectData,
        lastModified: new Date().toISOString(),
        cloudProvider: this.activeProvider.id,
      });

      this.lastSyncTime = new Date();
      this.syncStatus = 'connected';

      console.log('Project saved to cloud');
      return savedProject;
    } catch (error) {
      this.syncStatus = 'error';
      console.error('Error saving project:', error);
      throw error;
    }
  }

  /**
   * Load project from cloud
   */
  async loadProject(projectId) {
    if (!this.activeProvider) {
      throw new Error('No active cloud provider');
    }

    try {
      this.syncStatus = 'syncing';

      const project = await this.activeProvider.loadProject(projectId);

      this.lastSyncTime = new Date();
      this.syncStatus = 'connected';

      console.log('Project loaded from cloud');
      return project;
    } catch (error) {
      this.syncStatus = 'error';
      console.error('Error loading project:', error);
      throw error;
    }
  }

  /**
   * List projects in cloud
   */
  async listProjects() {
    if (!this.activeProvider) {
      throw new Error('No active cloud provider');
    }

    try {
      const projects = await this.activeProvider.listProjects();
      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      throw error;
    }
  }

  /**
   * Delete project from cloud
   */
  async deleteProject(projectId) {
    if (!this.activeProvider) {
      throw new Error('No active cloud provider');
    }

    try {
      await this.activeProvider.deleteProject(projectId);
      console.log('Project deleted from cloud');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      status: this.syncStatus,
      provider: this.activeProvider?.name || null,
      lastSync: this.lastSyncTime,
    };
  }
}

// Create singleton instance
const cloudSync = new CloudSync();

// Register built-in localStorage provider (for demo/offline use)
cloudSync.registerProvider({
  id: 'local-storage',
  name: 'This computer',
  description: 'Projects saved in the app\u2019s local storage, on this computer only',
  icon: '💾',

  async connect() {
    return true;
  },

  async disconnect() {
    return true;
  },

  async saveProject(projectData) {
    const projects = JSON.parse(localStorage.getItem('lvgl_cloud_projects') || '[]');
    const projectId = projectData.projectName.toLowerCase().replace(/\s+/g, '-');

    const existingIndex = projects.findIndex(p => p.id === projectId);
    const project = {
      id: projectId,
      data: projectData,
      savedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem('lvgl_cloud_projects', JSON.stringify(projects));
    return project;
  },

  async loadProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('lvgl_cloud_projects') || '[]');
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    return project.data;
  },

  async listProjects() {
    const projects = JSON.parse(localStorage.getItem('lvgl_cloud_projects') || '[]');
    return projects.map(p => ({
      id: p.id,
      name: p.data.projectName,
      savedAt: p.savedAt,
      version: p.data.version,
    }));
  },

  async deleteProject(projectId) {
    const projects = JSON.parse(localStorage.getItem('lvgl_cloud_projects') || '[]');
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem('lvgl_cloud_projects', JSON.stringify(filtered));
  },
});

export default cloudSync;

// Example custom provider structure for documentation:
export const exampleCloudProvider = {
  id: 'my-cloud',
  name: 'My Cloud Storage',
  description: 'Custom cloud storage provider',
  icon: '☁️',

  // Called once when provider is registered
  async initialize(config) {
    console.log('Initializing with config:', config);
  },

  // Called when user connects to this provider
  async connect(config) {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error('API key required');
    }
    // Authenticate with your backend
    return true;
  },

  // Called when user disconnects
  async disconnect() {
    // Clean up connections
  },

  // Save project to cloud
  async saveProject(projectData) {
    // const response = await fetch('https://api.example.com/projects', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(projectData),
    // });
    // return response.json();
    return projectData;
  },

  // Load project from cloud
  async loadProject(_projectId) {
    // const response = await fetch(`https://api.example.com/projects/${projectId}`);
    // return response.json();
    return {};
  },

  // List all projects
  async listProjects() {
    // const response = await fetch('https://api.example.com/projects');
    // return response.json();
    return [];
  },

  // Delete project
  async deleteProject(_projectId) {
    // await fetch(`https://api.example.com/projects/${projectId}`, {
    //   method: 'DELETE',
    // });
  },
};
