class AdminDashboard {
    constructor() {
        // UPDATED: Check for car sales token
        if (localStorage.getItem('adminToken') !== 'CAR_SALES_SECRET_KEY_2024') {
            return; // Stop the dashboard from loading data
        }
        
        // UPDATED: Changed endpoints from products/categories to cars/brands
        this.baseUrl = 'https://autoretail-backend.onrender.com/api'; // Your backend URL
        this.carsUrl = `${this.baseUrl}/cars`;
        this.brandsUrl = `${this.baseUrl}/brands`;
        
        this.currentCarId = null;
        this.imagesToUpload = [];
        this.currentImages = [];
        this.itemToDelete = null;
        
        // Pagination
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageSize = 20;
        
        // Filters
        this.currentFilters = {
            brand: '',
            condition: '',
            search: ''
        };
        
        this.initializeEventListeners();
        this.loadDashboardData();
        this.loadBrands();
        this.loadBrandsForFilter();
    }
    
    initializeEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar nav li').forEach(item => {
            item.addEventListener('click', () => this.switchSection(item.dataset.section));
        });
        
        // Forms
        document.getElementById('car-form')?.addEventListener('submit', (e) => this.saveCar(e));
        document.getElementById('car-images')?.addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('brand-form')?.addEventListener('submit', (e) => this.saveBrand(e));
        document.getElementById('add-brand-btn')?.addEventListener('click', () => this.openBrandModal());
        
        // Search and filters
        document.getElementById('search-btn')?.addEventListener('click', () => this.searchCars());
        document.getElementById('search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCars();
        });
        document.getElementById('filter-brand')?.addEventListener('change', (e) => this.applyFilter('brand', e.target.value));
        document.getElementById('filter-condition')?.addEventListener('change', (e) => this.applyFilter('condition', e.target.value));
        document.getElementById('clear-filters')?.addEventListener('click', () => this.clearFilters());
        
        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', () => this.changePage(-1));
        document.getElementById('next-page')?.addEventListener('click', () => this.changePage(1));
        
        // Modals
        document.querySelectorAll('.close-modal, .cancel-delete, .close-brand-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        document.querySelector('.confirm-delete')?.addEventListener('click', () => this.confirmDelete());
        
        // Cancel button
        document.getElementById('cancel-btn')?.addEventListener('click', () => {
            this.resetForm();
            this.switchSection('cars');
        });
    }

    // --- 1. LOAD DASHBOARD DATA ---
    async loadDashboardData() {
        try {
            const [carsRes, brandsRes] = await Promise.all([
                fetch(`${this.carsUrl}?page=${this.currentPage}&limit=${this.pageSize}`),
                fetch(this.brandsUrl)
            ]);
            
            const carsData = await carsRes.json();
            const brandsData = await brandsRes.json();

            if (carsData.success) {
                // Update total cars count
                document.getElementById('total-cars').textContent = carsData.total || 0;
                
                // Calculate total inventory value
                let totalValue = 0;
                if (carsData.data && carsData.data.length > 0) {
                    totalValue = carsData.data.reduce((sum, car) => sum + (car.price || 0), 0);
                }
                document.getElementById('total-value').textContent = 
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalValue);
                
                // Load cars table with pagination
                this.loadCarsTable(carsData.data);
                this.updatePagination(carsData.totalPages, carsData.currentPage, carsData.total);
            }
            
            if (brandsData.success) {
                document.getElementById('total-brands').textContent = brandsData.count || 0;
                this.loadBrandsTable(brandsData.data);
            }
            
        } catch (error) {
            console.error("Dashboard data load error:", error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    // --- 2. CARS TABLE ---
    loadCarsTable(cars) {
        const tbody = document.getElementById('cars-table-body');
        if (!tbody) return;
        
        if (!cars || cars.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-car"></i>
                        <h3>No cars found</h3>
                        <p>Add your first car to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        cars.forEach(car => {
            const row = document.createElement('tr');
            const imageUrl = car.images && car.images[0] ? car.images[0] : 'placeholder.jpg';
            const price = new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(car.price);
            
            const brandName = car.brand ? (car.brand.name || car.brand) : 'N/A';
            
            // Determine status badge
            const status = car.isAvailable === false ? 'Sold' : 'Available';
            const statusClass = car.isAvailable === false ? 'status-sold' : 'status-available';
            
            // Determine condition badge
            const conditionClass = `condition-${car.condition?.toLowerCase().replace(' ', '-') || 'used'}`;
            
            row.innerHTML = `
                <td>
                    <img src="${imageUrl}" 
                         alt="${car.title}" 
                         onclick="adminDashboard.viewImage('${imageUrl}')"
                         style="cursor: pointer;">
                </td>
                <td>
                    <strong>${car.title}</strong>
                    <br><small>${car.model || ''} • ${car.year || ''}</small>
                </td>
                <td>${brandName}</td>
                <td><span class="year-badge">${car.year || 'N/A'}</span></td>
                <td><strong class="price">${price}</strong></td>
                <td><span class="condition-badge ${conditionClass}">${car.condition || 'N/A'}</span></td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editCar('${car._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('${car._id}', 'car', '${car.title}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- 3. BRANDS TABLE ---
    loadBrandsTable(brands) {
        const tbody = document.getElementById('brands-table-body');
        if (!tbody) return;
        
        if (!brands || brands.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-car-battery"></i>
                        <h3>No brands found</h3>
                        <p>Add your first brand to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = brands.map(brand => `
            <tr>
                <td>
                    ${brand.logo ? 
                        `<img src="${brand.logo}" alt="${brand.name}" class="brand-logo">` : 
                        `<div class="brand-logo-placeholder"><i class="fas fa-car-battery"></i></div>`
                    }
                </td>
                <td><strong>${brand.name}</strong></td>
                <td>${brand.country || 'N/A'}</td>
                <td>${brand.carCount || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.editBrand('${brand._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteItem('${brand._id}', 'brand', '${brand.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // --- 4. EDIT & SAVE CAR ---
    async editCar(carId) {
        try {
            const res = await fetch(`${this.carsUrl}/${carId}`);
            const data = await res.json();
            
            if (data.success) {
                const car = data.data;
                this.currentCarId = carId;
                
                // Fill form with car data
                document.getElementById('car-title').value = car.title || '';
                document.getElementById('car-brand').value = car.brand?._id || car.brand || '';
                document.getElementById('car-model').value = car.model || '';
                document.getElementById('car-year').value = car.year || '';
                document.getElementById('car-price').value = car.price || '';
                document.getElementById('car-condition').value = car.condition || '';
                document.getElementById('car-mileage').value = car.mileage || '';
                document.getElementById('car-transmission').value = car.transmission || '';
                document.getElementById('car-fuel-type').value = car.fuelType || '';
                document.getElementById('car-color').value = car.color || '';
                document.getElementById('car-vin').value = car.vin || '';
                document.getElementById('car-location').value = car.location || '';
                document.getElementById('car-features').value = car.features?.join(', ') || '';
                document.getElementById('car-description').value = car.description || '';
                
                // Handle images
                this.currentImages = car.images ? car.images.map(url => ({
                    preview: url,
                    isExisting: true
                })) : [];
                this.updateImagePreview();
                
                this.switchSection('add-car');
            }
        } catch (error) {
            console.error('Error loading car:', error);
            this.showNotification('Error loading car details', 'error');
        }
    }

    async saveCar(event) {
        event.preventDefault();
        const submitBtn = document.getElementById('submit-btn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const formData = new FormData();
            
            // Add all car fields
            formData.append('title', document.getElementById('car-title').value);
            formData.append('brand', document.getElementById('car-brand').value);
            formData.append('model', document.getElementById('car-model').value);
            formData.append('year', document.getElementById('car-year').value);
            formData.append('price', document.getElementById('car-price').value);
            formData.append('condition', document.getElementById('car-condition').value);
            formData.append('mileage', document.getElementById('car-mileage').value);
            formData.append('transmission', document.getElementById('car-transmission').value);
            formData.append('fuelType', document.getElementById('car-fuel-type').value);
            formData.append('color', document.getElementById('car-color').value);
            formData.append('vin', document.getElementById('car-vin').value);
            formData.append('location', document.getElementById('car-location').value);
            formData.append('description', document.getElementById('car-description').value);
            
            // Handle features (comma separated)
            const features = document.getElementById('car-features').value;
            if (features) {
                formData.append('features', features);
            }
            
            // Add images
            this.imagesToUpload.forEach(file => {
                formData.append('images', file);
            });
            
            // Determine URL and method
            const url = this.currentCarId ? `${this.carsUrl}/${this.currentCarId}` : this.carsUrl;
            const method = this.currentCarId ? 'PUT' : 'POST';
            
            // Add authorization header
            const headers = {
                'Authorization': localStorage.getItem('adminToken')
            };
            
            const response = await fetch(url, {
                method,
                body: formData,
                headers
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(
                    this.currentCarId ? 'Car updated successfully!' : 'Car added successfully!',
                    'success'
                );
                this.resetForm();
                this.loadDashboardData();
                this.switchSection('cars');
            } else {
                this.showNotification(data.message || 'Save failed', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Server connection error', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Car';
        }
    }

    // --- 5. BRAND MANAGEMENT ---
    openBrandModal(brandId = null) {
        const modal = document.getElementById('brand-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('brand-form');
        
        if (brandId) {
            title.textContent = 'Edit Brand';
            this.loadBrandForEdit(brandId);
        } else {
            title.textContent = 'Add New Brand';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    async loadBrandForEdit(brandId) {
        try {
            const res = await fetch(`${this.brandsUrl}/${brandId}`);
            const data = await res.json();
            
            if (data.success) {
                const brand = data.data;
                document.getElementById('brand-id').value = brand._id;
                document.getElementById('brand-name').value = brand.name || '';
                document.getElementById('brand-country').value = brand.country || '';
                document.getElementById('brand-logo').value = brand.logo || '';
                document.getElementById('brand-description').value = brand.description || '';
            }
        } catch (error) {
            console.error('Error loading brand:', error);
        }
    }

    async saveBrand(event) {
        event.preventDefault();
        
        const brandId = document.getElementById('brand-id').value;
        const brandData = {
            name: document.getElementById('brand-name').value,
            country: document.getElementById('brand-country').value,
            logo: document.getElementById('brand-logo').value,
            description: document.getElementById('brand-description').value
        };
        
        try {
            const url = brandId ? `${this.brandsUrl}/${brandId}` : this.brandsUrl;
            const method = brandId ? 'PUT' : 'POST';
            
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('adminToken')
            };
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(brandData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(
                    brandId ? 'Brand updated successfully!' : 'Brand added successfully!',
                    'success'
                );
                this.closeAllModals();
                this.loadDashboardData();
                this.loadBrands();
                this.loadBrandsForFilter();
            } else {
                this.showNotification(data.message || 'Save failed', 'error');
            }
        } catch (error) {
            console.error('Brand save error:', error);
            this.showNotification('Server connection error', 'error');
        }
    }

    // --- 6. DELETE FUNCTIONALITY ---
    deleteItem(id, type, name) {
        this.itemToDelete = { id, type, name };
        document.getElementById('delete-message').textContent = 
            `Are you sure you want to delete this ${type}: "${name}"?`;
        document.getElementById('delete-modal').classList.add('active');
    }

    async confirmDelete() {
        if (!this.itemToDelete) return;
        
        try {
            const url = this.itemToDelete.type === 'car' 
                ? `${this.carsUrl}/${this.itemToDelete.id}`
                : `${this.brandsUrl}/${this.itemToDelete.id}`;
            
            const headers = {
                'Authorization': localStorage.getItem('adminToken')
            };
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`${this.itemToDelete.type} deleted successfully!`, 'success');
                this.closeAllModals();
                this.loadDashboardData();
                if (this.itemToDelete.type === 'brand') {
                    this.loadBrands();
                    this.loadBrandsForFilter();
                }
            } else {
                this.showNotification(data.message || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Server connection error', 'error');
        }
        
        this.itemToDelete = null;
    }

    // --- 7. SEARCH & FILTERS ---
    async searchCars() {
        const searchTerm = document.getElementById('search-input').value.trim();
        if (searchTerm) {
            this.currentFilters.search = searchTerm;
            await this.applyFilters();
        }
    }

    applyFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.applyFilters();
    }

    async applyFilters() {
        try {
            const params = new URLSearchParams();
            if (this.currentFilters.search) params.append('search', this.currentFilters.search);
            if (this.currentFilters.brand) params.append('brand', this.currentFilters.brand);
            if (this.currentFilters.condition) params.append('condition', this.currentFilters.condition);
            
            params.append('page', this.currentPage);
            params.append('limit', this.pageSize);
            
            const response = await fetch(`${this.carsUrl}/search?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                this.loadCarsTable(data.data);
                document.getElementById('total-cars').textContent = data.count || 0;
            }
        } catch (error) {
            console.error('Filter error:', error);
        }
    }

    clearFilters() {
        this.currentFilters = { brand: '', condition: '', search: '' };
        document.getElementById('search-input').value = '';
        document.getElementById('filter-brand').value = '';
        document.getElementById('filter-condition').value = '';
        this.currentPage = 1;
        this.loadDashboardData();
    }

    // --- 8. PAGINATION ---
    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.loadDashboardData();
        }
    }

    updatePagination(totalPages, currentPage, totalItems) {
        this.totalPages = totalPages;
        this.currentPage = currentPage || 1;
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages} (${totalItems || 0} cars)`;
        }
    }

    // --- 9. IMAGE HANDLING ---
    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (this.imagesToUpload.length >= 10) {
                this.showNotification('Maximum 10 images allowed', 'warning');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('Image must be less than 5MB', 'warning');
                return;
            }
            
            this.imagesToUpload.push(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                this.currentImages.push({ preview: event.target.result });
                this.updateImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    updateImagePreview() {
        const container = document.getElementById('image-preview');
        if (!container) return;
        
        container.innerHTML = this.currentImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img.preview}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="adminDashboard.removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeImage(index) {
        if (this.currentImages[index].isExisting) {
            // For existing images, we just remove from preview but keep in database
            this.currentImages.splice(index, 1);
        } else {
            // For new images, remove from both arrays
            this.imagesToUpload.splice(index, 1);
            this.currentImages.splice(index, 1);
        }
        this.updateImagePreview();
    }

    viewImage(url) {
        const modalImage = document.getElementById('modal-image');
        if (modalImage) {
            modalImage.src = url;
            document.getElementById('image-modal').classList.add('active');
        }
    }

    // --- 10. UTILITY FUNCTIONS ---
    async loadBrands() {
        try {
            const response = await fetch(this.brandsUrl);
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('car-brand');
                if (select) {
                    select.innerHTML = '<option value="">Select a brand</option>' + 
                        data.data.map(brand => 
                            `<option value="${brand._id}">${brand.name}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    async loadBrandsForFilter() {
        try {
            const response = await fetch(this.brandsUrl);
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('filter-brand');
                if (select) {
                    select.innerHTML = '<option value="">All Brands</option>' + 
                        data.data.map(brand => 
                            `<option value="${brand._id}">${brand.name}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('Error loading brands for filter:', error);
        }
    }

    resetForm() {
        document.getElementById('car-form').reset();
        this.currentCarId = null;
        this.currentImages = [];
        this.imagesToUpload = [];
        this.updateImagePreview();
    }

    switchSection(id) {
        // Update sidebar active state
        document.querySelectorAll('.sidebar nav li').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === id) {
                item.classList.add('active');
            }
        });
        
        // Show the selected section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${id}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.itemToDelete = null;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageSpan = document.getElementById('notification-message');
        
        if (!notification || !messageSpan) {
            console.log(`${type}: ${message}`);
            return;
        }
        
        messageSpan.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }
}

// Initialize the dashboard
const adminDashboard = new AdminDashboard();
window.adminDashboard = adminDashboard;