

class BuyList {
    constructor() {
        this.items = [];
        this.currentId = 1;
        this.init();
    }

    init() {
        // Initialize with 3 default items
        this.addItem('Печиво', 2);
        this.addItem('Сир', 1);
        this.addItem('Помідори', 2, true); // Mark as purchased

        this.bindEvents();
        this.renderItems();
        this.updateStatistics();
    }

    bindEvents() {
        const input = document.querySelector('.main input[type="text"]');
        const addButton = document.querySelector('.main > button');

        // Add item on button click
        addButton.addEventListener('click', () => {
            this.handleAddItem();
        });

        // Add item on Enter key press
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddItem();
            }
        });
    }

    handleAddItem() {
        const input = document.querySelector('.main input[type="text"]');
        const name = input.value.trim();
        
        if (name) {
            this.addItem(name);
            input.value = '';
            input.focus();
            this.renderItems();
            this.updateStatistics();
        }
    }

    addItem(name, count = 1, purchased = false) {
        const item = {
            id: this.currentId++,
            name: name,
            count: count,
            purchased: purchased
        };
        this.items.push(item);
        return item;
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItems();
        this.updateStatistics();
    }

    togglePurchased(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.purchased = !item.purchased;
            this.renderItems();
            this.updateStatistics();
        }
    }

    updateCount(id, delta) {
        const item = this.items.find(item => item.id === id);
        if (item && !item.purchased) {
            const newCount = item.count + delta;
            if (newCount >= 1) {
                item.count = newCount;
                this.renderItems();
                this.updateStatistics();
            }
        }
    }

    updateName(id, newName) {
        const item = this.items.find(item => item.id === id);
        if (item && newName.trim()) {
            item.name = newName.trim();
            this.renderItems();
            this.updateStatistics();
        }
    }

    renderItems() {
        const container = document.querySelector('.main');
        const input = container.querySelector('input[type="text"]');
        const addButton = container.querySelector('button');
        
        // Remove all existing items
        const existingItems = container.querySelectorAll('.item');
        existingItems.forEach(item => item.remove());

        // Render all items
        this.items.forEach(item => {
            const itemElement = this.createItemElement(item);
            container.appendChild(itemElement);
        });
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = `item${item.purchased ? ' куплено' : ''}`;
        div.dataset.id = item.id;

        if (item.purchased) {
            // Purchased item layout
            div.innerHTML = `
                <span class="name"><s>${item.name}</s></span>
                <div class="count-controls">
                    <span class="count">${item.count}</span>
                </div>
                <button class="status">Не куплено</button>
            `;
        } else {
            // Not purchased item layout
            div.innerHTML = `
                <span class="name">${item.name}</span>
                <div class="count-controls">
                    <button class="btn red" data-tooltip="Зменшити"${item.count <= 1 ? ' disabled' : ''}>−</button>
                    <span class="count">${item.count}</span>
                    <button class="btn green" data-tooltip="Збільшити">+</button>
                </div>
                <button class="status" data-tooltip="Позначити як куплено">Куплено</button>
                <button class="btn red square" data-tooltip="Видалити">✖</button>
            `;
        }

        this.bindItemEvents(div, item);
        return div;
    }

    bindItemEvents(element, item) {
        const nameSpan = element.querySelector('.name');
        const decreaseBtn = element.querySelector('.btn.red:not(.square)');
        const increaseBtn = element.querySelector('.btn.green');
        const statusBtn = element.querySelector('.status');
        const deleteBtn = element.querySelector('.btn.red.square');

        // Name editing (only for non-purchased items)
        if (!item.purchased) {
            nameSpan.addEventListener('click', () => {
                this.startNameEdit(nameSpan, item.id);
            });
        }

        // Count controls (only for non-purchased items)
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                this.updateCount(item.id, -1);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                this.updateCount(item.id, 1);
            });
        }

        // Status toggle
        statusBtn.addEventListener('click', () => {
            this.togglePurchased(item.id);
        });

        // Delete button (only for non-purchased items)
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteItem(item.id);
            });
        }
    }

    startNameEdit(nameSpan, itemId) {
        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'name-edit';
        
        // Replace span with input
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan);
        input.focus();
        input.select();

        const finishEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                this.updateName(itemId, newName);
            } else {
                // Restore original display
                input.remove();
                nameSpan.style.display = '';
            }
        };

        // Finish editing on blur or Enter
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    updateStatistics() {
        const remainingContainer = document.querySelector('.side .badge-list:first-of-type');
        const purchasedContainer = document.querySelector('.side .badge-list:last-of-type');

        // Clear existing badges
        remainingContainer.innerHTML = '';
        purchasedContainer.innerHTML = '';

        this.items.forEach(item => {
            const badge = document.createElement('div');
            badge.className = `badge${item.purchased ? ' куплено' : ''}`;
            
            if (item.purchased) {
                badge.innerHTML = `<s>${item.name}</s> <span class="count">${item.count}</span>`;
                purchasedContainer.appendChild(badge);
            } else {
                badge.innerHTML = `${item.name} <span class="count">${item.count}</span>`;
                remainingContainer.appendChild(badge);
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BuyList();
});

// Add some CSS for disabled buttons and name editing
const style = document.createElement('style');
style.textContent = `
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .name-edit {
        padding: 5px;
        border: 1px solid #3498db;
        border-radius: 4px;
        font-weight: bold;
        flex: 1;
    }
    
    .name-edit:focus {
        outline: none;
        border-color: #2980b9;
        box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
    }
`;
document.head.appendChild(style);