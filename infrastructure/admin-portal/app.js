const CONFIG = {
    USER_INFO_URL: '/user-info.json',
    LOGOUT_URL: 'https://admin.axelrasse.com/oauth2/sign_out?rd=https://admin.axelrasse.com/oauth2/sign_in',
    SEARCH_SHORTCUT: { ctrl: true, key: 'k' }
};

const SERVICES = [
    {
        name: 'Portainer',
        description: 'Docker container management interface',
        icon: '🐳',
        url: '/portainer/',
        status: 'active',
        searchTerms: 'portainer docker container management'
    },
    {
        name: 'pgweb',
        description: 'PostgreSQL database web interface',
        icon: '🗄️',
        url: '/pgweb/',
        status: 'active',
        searchTerms: 'pgweb database postgres web interface'
    },
    {
        name: 'Glances',
        description: 'System monitoring and performance metrics',
        icon: '📊',
        url: '/glances/',
        status: 'active',
        searchTerms: 'glances system monitoring performance'
    },
    {
        name: 'Metabase',
        description: 'Business intelligence and analytics dashboard',
        icon: '📈',
        url: 'https://dashboard.axelrasse.com',
        status: 'active',
        searchTerms: 'metabase business intelligence dashboard analytics'
    }
];

class AdminPortal {
    constructor() {
        this.elements = this.cacheElements();
        this.init();
    }

    cacheElements() {
        return {
            searchInput: document.getElementById('searchInput'),
            servicesList: document.getElementById('servicesList'),
            emptyState: document.getElementById('emptyState'),
            username: document.getElementById('username'),
            userAvatar: document.getElementById('userAvatar')
        };
    }

    init() {
        this.renderServices();
        this.setupSearch();
        this.setupKeyboardShortcuts();
        this.loadUserInfo();
    }

    renderServices() {
        const servicesHTML = SERVICES.map(service => this.createServiceHTML(service)).join('');
        this.elements.servicesList.innerHTML = servicesHTML;
    }

    createServiceHTML(service) {
        return `
            <a href="${service.url}" class="service" data-name="${service.searchTerms}">
                <div class="service-info">
                    <div class="service-icon">${service.icon}</div>
                    <div class="service-details">
                        <h3>${service.name}</h3>
                        <p>${service.description}</p>
                    </div>
                </div>
                <div class="service-status">
                    <div class="status-dot ${service.status}"></div>
                    <span class="status-text ${service.status}">${this.getStatusText(service.status)}</span>
                </div>
            </a>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            active: 'Running',
            planned: 'Planned',
            maintenance: 'Maintenance'
        };
        return statusMap[status] || 'Unknown';
    }

    setupSearch() {
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    handleSearch(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const services = this.elements.servicesList.querySelectorAll('.service');
        let visibleCount = 0;

        services.forEach(service => {
            const searchData = service.getAttribute('data-name');
            const isVisible = searchData.includes(normalizedQuery);
            
            service.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) visibleCount++;
        });

        this.toggleEmptyState(visibleCount === 0 && normalizedQuery);
    }

    toggleEmptyState(show) {
        this.elements.emptyState.style.display = show ? 'block' : 'none';
        this.elements.servicesList.style.display = show ? 'none' : 'grid';
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.isSearchShortcut(e)) {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        });
    }

    isSearchShortcut(event) {
        const { ctrl, key } = CONFIG.SEARCH_SHORTCUT;
        return event.ctrlKey === ctrl && event.key === key;
    }

    async loadUserInfo() {
        try {
            const userInfo = await this.fetchUserInfo();
            this.updateUserDisplay(userInfo);
        } catch (error) {
            console.error('Could not load user info:', error);
            this.setFallbackUser();
        }
    }

    async fetchUserInfo() {
        const response = await fetch(CONFIG.USER_INFO_URL, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch user info`);
        }

        return response.json();
    }

    updateUserDisplay(userInfo) {
        const username = this.extractUsername(userInfo);
        const email = userInfo.email || '';

        this.elements.username.textContent = username;
        this.elements.userAvatar.textContent = username.charAt(0).toUpperCase();

        if (email) {
            this.elements.username.title = email;
        }
    }

    extractUsername(userInfo) {
        return userInfo.login || 
               userInfo.user || 
               userInfo.preferred_username || 
               userInfo.email || 
               'User';
    }

    setFallbackUser() {
        this.elements.username.textContent = 'User';
        this.elements.userAvatar.textContent = 'U';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPortal();
});