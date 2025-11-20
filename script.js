let lists = JSON.parse(localStorage.getItem('fileMemoData_v7')) || [];
let currentListId = null;
let editingListId = null;
let selectedColor = 'blue';

const viewHome = document.getElementById('view-home');
const viewDetail = document.getElementById('view-detail');
const pcEmptyState = document.getElementById('pc-empty-state');
const detailContentWrapper = document.getElementById('detail-content-wrapper');

const listsContainer = document.getElementById('lists-container');
const itemsContainer = document.getElementById('items-container');

const detailTitle = document.getElementById('detail-title');
const detailDate = document.getElementById('detail-date');
const detailCount = document.getElementById('detail-count');
const detailCopies = document.getElementById('detail-copies');

const itemInput = document.getElementById('item-input');
const addBtn = document.getElementById('add-btn');

const modalCreate = document.getElementById('modal-create');
const modalContent = document.getElementById('modal-content');
const modalTitle = document.getElementById('modal-title');
const listNameInput = document.getElementById('list-name-input');
const colorBtns = document.querySelectorAll('.color-btn');

const colorMap = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', hover: 'hover:bg-blue-600', class: 'theme-blue' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', hover: 'hover:bg-indigo-600', class: 'theme-indigo' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', hover: 'hover:bg-emerald-600', class: 'theme-emerald' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', hover: 'hover:bg-amber-600', class: 'theme-amber' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', hover: 'hover:bg-rose-600', class: 'theme-rose' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', hover: 'hover:bg-purple-600', class: 'theme-purple' }
};

function isMobile() { return window.innerWidth < 768; }

function openList(id) {
    currentListId = id;
    if (isMobile()) {
        viewDetail.classList.remove('translate-x-full');
        // 移动端也需要显示详情内容
        pcEmptyState.classList.remove('md:flex');
        detailContentWrapper.classList.remove('hidden', 'md:hidden');
        detailContentWrapper.classList.add('flex');
    } else {
        // PC: 更新列表选中态，隐藏空状态，显示内容
        pcEmptyState.classList.remove('md:flex'); // 隐藏空状态
        detailContentWrapper.classList.remove('hidden', 'md:hidden'); // 显示内容
        detailContentWrapper.classList.add('flex');
    }

    renderLists(); // 刷新列表以更新选中态
    renderItems(); // 渲染内容
}

function goHome() {
    currentListId = null;

    if (isMobile()) {
        viewDetail.classList.add('translate-x-full');
        setTimeout(() => {
            // 移动端动画结束后清理，PC端不需要
            if (isMobile()) itemsContainer.innerHTML = '';
        }, 300);
    } else {
        // PC: 回到空状态
        pcEmptyState.classList.add('md:flex');
        detailContentWrapper.classList.add('hidden', 'md:hidden');
        detailContentWrapper.classList.remove('flex');
    }

    renderLists(); // 移除选中态
}

function renderLists() {
    listsContainer.innerHTML = '';

    if (lists.length === 0) {
        listsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-300 select-none">
                <i class="fa-solid fa-layer-group text-4xl mb-3 opacity-50"></i>
                <p class="text-sm">无检查单记录</p>
            </div>
        `;
        return;
    }

    lists.forEach((list, index) => {
        const colors = colorMap[list.color] || colorMap.blue;
        const activeCount = list.items.filter(i => !i.done).length;
        const totalCount = list.items.length;
        const progress = totalCount === 0 ? 0 : Math.round(((totalCount - activeCount) / totalCount) * 100);

        const isActive = list.id === currentListId;

        const card = document.createElement('div');
        // 根据状态应用样式：PC端选中会加 active 类
        const activeStyle = isActive ? `list-item-active ${colors.class}` : 'bg-white border-transparent';

        card.className = `group relative p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mb-3 overflow-hidden ${activeStyle} ${isActive ? '' : 'hover:border-slate-200'}`;
        card.onclick = () => openList(list.id);

        // Add drag-and-drop attributes
        card.draggable = true;
        card.dataset.listId = list.id;
        card.dataset.listIndex = index;

        card.innerHTML = `
            <!-- 颜色条 (未选中时显示) -->
            ${!isActive ? `<div class="absolute left-0 top-0 bottom-0 w-1.5 ${colors.bg}"></div>` : ''}
            
            <div class="flex justify-between items-start mb-2 pl-2">
                <h3 class="text-base font-bold ${isActive ? colors.text : 'text-slate-700'}">${escapeHtml(list.title)}</h3>
                ${activeCount > 0 ? `<span class="text-[10px] font-bold ${isActive ? 'bg-white/50' : colors.light} ${colors.text} px-2 py-0.5 rounded-lg">${activeCount}</span>` : ''}
            </div>

            <div class="pl-2">
                <div class="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${colors.bg} rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>
        `;

        // Drag event handlers
        card.addEventListener('dragstart', handleListDragStart);
        card.addEventListener('dragover', handleListDragOver);
        card.addEventListener('drop', handleListDrop);
        card.addEventListener('dragend', handleListDragEnd);

        listsContainer.appendChild(card);
    });
}
let draggedListElement = null;

function handleListDragStart(e) {
    draggedListElement = e.currentTarget;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleListDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const targetElement = e.currentTarget;
    if (draggedListElement && draggedListElement !== targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
            targetElement.parentNode.insertBefore(draggedListElement, targetElement);
        } else {
            targetElement.parentNode.insertBefore(draggedListElement, targetElement.nextSibling);
        }
    }

    return false;
}

function handleListDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}

function handleListDragEnd(e) {
    e.currentTarget.style.opacity = '1';

    // Update lists array based on new DOM order
    const listElements = Array.from(listsContainer.children).filter(el => el.dataset.listId);
    const newOrder = listElements.map(el => el.dataset.listId);

    lists = newOrder.map(id => lists.find(l => l.id.toString() === id));
    saveData();
    renderLists(); // Re-render to update indices
}

function renderItems() {
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;

    const colors = colorMap[list.color] || colorMap.blue;

    // 1. 更新头部信息
    detailTitle.innerText = list.title;
    detailDate.innerText = new Date(list.id).toLocaleDateString('zh-CN'); // 简单使用创建日期

    // 2. 更新主题色
    addBtn.className = `${colors.bg} ${colors.hover} text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all shrink-0 active:scale-95`;
    document.querySelector('.theme-text-color').className = `text-xl md:text-2xl font-black mt-0.5 ${colors.text} theme-text-color`;

    // 3. 统计
    const activeItems = list.items.filter(i => !i.done);
    detailCount.innerText = activeItems.length;
    const totalCopies = list.items.reduce((sum, i) => sum + (i.done ? 0 : i.count), 0);
    detailCopies.innerText = totalCopies;

    // 4. 渲染列表
    itemsContainer.innerHTML = '';

    if (list.items.length === 0) {
        itemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center pt-20 text-slate-300 select-none">
                <i class="fa-solid fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                <p class="text-sm">暂无项目，请添加</p>
            </div>
        `;
    } else {
        const sortedItems = [...list.items].sort((a, b) => a.done - b.done || b.time - a.time);

        sortedItems.forEach((item, index) => {
            const el = document.createElement('div');

            const activeClass = "bg-white border-slate-100 shadow-sm opacity-100";
            const doneClass = "bg-slate-50 border-transparent shadow-none opacity-60 scale-[0.99]";
            const textDone = item.done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800";

            const numBg = item.done
                ? "bg-slate-200 text-slate-400"
                : `${colors.light} ${colors.text} group-hover:brightness-95`;

            el.className = `group flex items-center p-3 md:p-4 rounded-2xl border transition-all duration-300 card-enter relative select-none mb-2 ${item.done ? doneClass : activeClass}`;

            // Add drag-and-drop attributes
            el.draggable = !item.done; // Only allow dragging of non-done items
            el.dataset.itemId = item.id;
            el.dataset.itemIndex = index;

            el.innerHTML = `
                <div class="flex-1 min-w-0 flex flex-col justify-center cursor-pointer pr-4" onclick="toggleItemStatus(${item.id})">
                    <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 rounded-full border-2 ${item.done ? 'border-slate-300 bg-transparent' : `border-transparent ${colors.bg}`} transition-colors shrink-0"></div>
                        <span class="font-bold text-[15px] truncate transition-all ${textDone}">${escapeHtml(item.name)}</span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="relative h-9 min-w-[80px] rounded-lg flex items-center justify-between px-1 transition-all cursor-ew-resize touch-none select-none ${numBg}"
                            id="drag-target-${item.id}">
                        <button onclick="updateItemCount(${item.id}, -1)" class="w-6 h-full flex items-center justify-center opacity-50 hover:opacity-100 z-10"><i class="fa-solid fa-minus text-[8px]"></i></button>
                        <span class="font-extrabold text-base z-0 mx-1" id="disp-${item.id}">${item.count}</span>
                        <button onclick="updateItemCount(${item.id}, 1)" class="w-6 h-full flex items-center justify-center opacity-50 hover:opacity-100 z-10"><i class="fa-solid fa-plus text-[8px]"></i></button>
                        
                        <div class="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap pointer-events-none md:hidden">滑动</div>
                    </div>

                    <button onclick="deleteItem(${item.id})" class="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;

            // Drag event handlers for items
            if (!item.done) {
                el.addEventListener('dragstart', handleItemDragStart);
                el.addEventListener('dragover', handleItemDragOver);
                el.addEventListener('drop', handleItemDrop);
                el.addEventListener('dragend', handleItemDragEnd);
            }

            itemsContainer.appendChild(el);
            if (!item.done) setupDragInteraction(item.id, list.color);
        });
    }

    // 底部留白 (仅移动端需要大留白)
    const spacer = document.createElement('div');
    spacer.className = isMobile() ? "h-24 w-full" : "h-8 w-full";
    itemsContainer.appendChild(spacer);
}
let draggedItemElement = null;

function handleItemDragStart(e) {
    draggedItemElement = e.currentTarget;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleItemDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const targetElement = e.currentTarget;
    if (draggedItemElement && draggedItemElement !== targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
            targetElement.parentNode.insertBefore(draggedItemElement, targetElement);
        } else {
            targetElement.parentNode.insertBefore(draggedItemElement, targetElement.nextSibling);
        }
    }

    return false;
}

function handleItemDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}

function handleItemDragEnd(e) {
    e.currentTarget.style.opacity = '1';

    // Update items array based on new DOM order
    const itemElements = Array.from(itemsContainer.children).filter(el => el.dataset.itemId);
    const newOrder = itemElements.map(el => el.dataset.itemId);

    const list = lists.find(l => l.id === currentListId);
    if (list) {
        list.items = newOrder.map(id => list.items.find(i => i.id.toString() === id));
        saveData();
        renderItems(); // Re-render to update indices
    }
}


function addItem() {
    const name = itemInput.value.trim();
    if (!name || !currentListId) {
        if (!name) shakeInput(itemInput.parentElement);
        itemInput.focus();
        return;
    }
    const listIndex = lists.findIndex(l => l.id === currentListId);
    if (listIndex !== -1) {
        lists[listIndex].items.unshift({
            id: Date.now(), name: name, count: 1, done: false, time: Date.now()
        });
        itemInput.value = '';
        saveData();
        renderItems();
        renderLists(); // update count
        itemsContainer.scrollTop = 0;
    }
}

function toggleItemStatus(itemId) {
    const list = lists.find(l => l.id === currentListId);
    if (list) {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            item.done = !item.done;
            saveData();
            renderItems();
            renderLists(); // update progress
        }
    }
}

function updateItemCount(itemId, delta) {
    const list = lists.find(l => l.id === currentListId);
    if (list) {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            let newVal = item.count + delta;
            if (newVal < 0) newVal = 0;
            item.count = newVal;
            const disp = document.getElementById(`disp-${itemId}`);
            if (disp) disp.innerText = newVal;
            saveData();

            // Update header copies
            const totalCopies = list.items.reduce((sum, i) => sum + (i.done ? 0 : i.count), 0);
            detailCopies.innerText = totalCopies;
        }
    }
}

function deleteItem(itemId) {
    if (confirm('删除此项目？')) {
        const listIndex = lists.findIndex(l => l.id === currentListId);
        if (listIndex !== -1) {
            lists[listIndex].items = lists[listIndex].items.filter(i => i.id !== itemId);
            saveData();
            renderItems();
            renderLists();
        }
    }
}

function showCreateModal() {
    editingListId = null;
    modalTitle.innerText = "新建检查单";
    listNameInput.value = "";
    selectColor('blue');
    modalCreate.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    });
    setTimeout(() => listNameInput.focus(), 100);
}

function editList() {
    if (!currentListId) return;
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    editingListId = list.id;
    modalTitle.innerText = "编辑检查单";
    listNameInput.value = list.title;
    selectColor(list.color);
    modalCreate.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    });
}

function closeModal() {
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modalCreate.classList.add('hidden'), 300);
}

function selectColor(color) {
    selectedColor = color;
    colorBtns.forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.remove('opacity-40');
            btn.classList.add('scale-110', 'ring-2');
        } else {
            btn.classList.add('opacity-40');
            btn.classList.remove('scale-110', 'ring-2');
        }
    });
}

function saveList() {
    const name = listNameInput.value.trim();
    if (!name) { shakeInput(listNameInput); return; }

    if (editingListId) {
        const list = lists.find(l => l.id === editingListId);
        if (list) {
            list.title = name;
            list.color = selectedColor;
            saveData();
            closeModal();
            renderItems();
        }
    } else {
        const newList = {
            id: Date.now(), title: name, color: selectedColor, items: []
        };
        lists.unshift(newList);
        saveData();
        closeModal();
        // PC上如果当前是空状态，自动选中新建的
        if (!isMobile() && !currentListId) openList(newList.id);
    }
    renderLists();
}

function deleteCurrentList() {
    if (confirm('删除检查单及其所有内容？')) {
        lists = lists.filter(l => l.id !== currentListId);
        saveData();
        goHome();
    }
}

// --- Short URL Configuration ---
let shortUrlConfig = JSON.parse(localStorage.getItem('fileMemoShortUrlConfig')) || { enabled: false, apiUrl: '', apiKey: '' };
let shortUrlCache = JSON.parse(localStorage.getItem('fileMemoShortUrlCache')) || {};

// --- S3 Synchronization ---
let s3Client = null;
let s3Config = JSON.parse(localStorage.getItem('fileMemoS3Config')) || null;
async function shareList() {
    if (!currentListId) return;
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;

    // Serialize and Encode to create long URL
    const json = JSON.stringify(list);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const safeEncoded = encodeURIComponent(encoded);
    const longUrl = `${window.location.origin}${window.location.pathname}?share=${safeEncoded}`;

    let finalUrl = longUrl;

    // Try to create short URL if enabled
    if (shortUrlConfig.enabled && shortUrlConfig.apiUrl && shortUrlConfig.apiKey) {
        try {
            // Check cache first
            const cacheKey = longUrl;
            const cached = shortUrlCache[cacheKey];

            // Use cached if not expired
            if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
                finalUrl = cached.shortUrl;
                console.log('Using cached short URL:', finalUrl);
            } else {
                // Create short URL via API
                const shortUrl = await createShortUrl(longUrl);
                if (shortUrl) {
                    finalUrl = shortUrl;
                } else {
                    console.warn('Failed to create short URL, using long URL');
                }
            }
        } catch (error) {
            console.error('Short URL error:', error);
            // Fall back to long URL on error
        }
    }

    // Copy to clipboard
    navigator.clipboard.writeText(finalUrl).then(() => {
        const message = finalUrl === longUrl
            ? '分享链接已复制到剪贴板！\n发送给朋友即可查看。'
            : '短链接已复制到剪贴板！\n发送给朋友即可查看。';
        alert(message);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        prompt('复制以下链接分享：', finalUrl);
    });
}

async function createShortUrl(longUrl) {
    try {
        const response = await fetch(shortUrlConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': shortUrlConfig.apiKey
            },
            body: JSON.stringify({
                url: longUrl,
                expirationSeconds: 31536000 // 1 year
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Short URL API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();

        // Cache the result
        const cacheKey = longUrl;
        shortUrlCache[cacheKey] = {
            shortUrl: data.shortUrl,
            slug: data.slug,
            createdAt: new Date().toISOString(),
            expiresAt: data.expiresAt
        };

        // Save cache to localStorage
        localStorage.setItem('fileMemoShortUrlCache', JSON.stringify(shortUrlCache));

        return data.shortUrl;
    } catch (error) {
        console.error('Failed to create short URL:', error);
        return null;
    }
}

function checkSharedUrl() {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
        try {
            // decodeURIComponent is handled by params.get() automatically? 
            // No, params.get() decodes the %XX in the URL.
            // So if we did encodeURIComponent(encoded), params.get() returns 'encoded' (the Base64 string).

            // Decode Base64
            const json = decodeURIComponent(escape(atob(shareData)));
            const sharedList = JSON.parse(json);
            renderSharedView(sharedList);
        } catch (e) {
            console.error('Invalid share data', e);
            alert('无效的分享链接: ' + e.message);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

function renderSharedView(list) {
    // 1. Layout Setup
    const viewHome = document.getElementById('view-home');
    if (viewHome) viewHome.classList.add('hidden');

    const viewDetail = document.getElementById('view-detail');
    viewDetail.classList.remove('translate-x-full', 'hidden');
    viewDetail.classList.add('w-full', 'fixed', 'inset-0', 'z-50', 'translate-x-0');

    const pcEmptyState = document.getElementById('pc-empty-state');
    const detailContentWrapper = document.getElementById('detail-content-wrapper');
    if (pcEmptyState) {
        pcEmptyState.classList.remove('md:flex'); // Remove responsive flex
        pcEmptyState.classList.add('hidden'); // Force hide
    }
    if (detailContentWrapper) {
        detailContentWrapper.classList.remove('hidden', 'md:hidden');
        detailContentWrapper.classList.add('flex');
    }

    // 2. Hide/Modify Elements for Read-Only Mode

    // Hide Bottom Input Bar
    const bottomBar = document.querySelector('#view-detail .p-5.bg-gradient-to-t');
    if (bottomBar) bottomBar.classList.add('hidden');

    // Hide Top Navigation Bar (The action buttons row)
    const navBar = document.querySelector('#view-detail .flex.justify-between.items-center.mb-4');
    if (navBar) navBar.classList.add('hidden');

    // Ensure title and stats section is visible
    const titleStatsSection = document.querySelector('#view-detail .flex.flex-col.md\\:flex-row');
    if (titleStatsSection) {
        titleStatsSection.classList.remove('hidden');
        titleStatsSection.classList.add('flex');
    }

    // Inject a new simple header for Shared View
    const headerContainer = document.querySelector('#view-detail .pt-8');
    if (headerContainer) {
        // Check if we already injected a shared banner
        if (!document.getElementById('shared-banner')) {
            const banner = document.createElement('div');
            banner.id = 'shared-banner';
            banner.className = 'mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100';
            banner.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                        <i class="fa-solid fa-share-nodes"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-blue-400 uppercase tracking-wider">Shared List</p>
                        <p class="text-sm font-medium text-blue-900">您可以勾选项目进行核对</p>
                    </div>
                </div>
                <button onclick="importSharedList()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm">
                    <i class="fa-solid fa-download mr-1"></i> 保存
                </button>
            `;
            // Insert after the navigation bar (which is now hidden)
            if (navBar && navBar.nextSibling) {
                headerContainer.insertBefore(banner, navBar.nextSibling);
            } else {
                headerContainer.insertBefore(banner, headerContainer.firstChild);
            }
        }
    }

    // 3. Data Setup
    window.sharedList = list;

    // CRITICAL: Reset all items to not-done state for shared view
    // Users should start with a clean slate when viewing shared lists
    list.items.forEach(item => {
        item.done = false;
    });

    currentListId = list.id;

    // Hack: Push to lists to use renderItems, but prevent saving
    const existingIdx = lists.findIndex(l => l.id === list.id);
    if (existingIdx !== -1) {
        list.id = Date.now();
        currentListId = list.id;
    }

    lists.push(list);

    // Save original functions before overriding
    window.originalSaveData = saveData;
    window.originalRenderItems = renderItems;
    window.originalRenderLists = renderLists;

    // In read-only mode, allow in-memory updates for UI but skip localStorage save
    window.saveData = () => {
        // Don't call localStorage.setItem, but data changes in memory are allowed
    };

    // Override renderLists to do nothing in shared view (no sidebar)
    window.renderLists = () => {
        // Do nothing in shared view
    };

    // Helper function to setup event listeners for shared view
    // This needs to be called after every renderItems() call
    function setupSharedViewEventListeners() {
        const itemsContainer = document.getElementById('items-container');

        // Hide action buttons
        const itemActions = itemsContainer.querySelectorAll('button');
        itemActions.forEach(btn => {
            // Hide delete buttons (they have fa-xmark)
            if (btn.querySelector('.fa-xmark')) {
                btn.classList.add('hidden');
            }
            // Hide drag buttons (plus/minus)
            if (btn.querySelector('.fa-plus') || btn.querySelector('.fa-minus')) {
                const counterWrapper = btn.closest('.relative');
                if (counterWrapper) {
                    counterWrapper.classList.add('pointer-events-none');
                    btn.classList.add('hidden');
                }
            }
        });

        // Add click event listeners to item elements
        const itemElements = itemsContainer.querySelectorAll('.group.flex.items-center');

        itemElements.forEach((itemEl) => {
            const itemId = parseInt(itemEl.dataset.itemId);
            if (!itemId) {
                return;
            }

            const clickableArea = itemEl.querySelector('.flex-1.min-w-0');
            if (clickableArea) {
                // Remove any existing onclick attribute
                clickableArea.removeAttribute('onclick');

                // Remove any existing listeners by cloning the element
                const newClickableArea = clickableArea.cloneNode(true);
                clickableArea.parentNode.replaceChild(newClickableArea, clickableArea);

                // Add fresh click event listener
                newClickableArea.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleItemStatus(itemId);
                });

                newClickableArea.style.cursor = 'pointer';
                newClickableArea.style.pointerEvents = 'auto';
            }
        });
    }

    // Override renderItems to call setupSharedViewEventListeners after rendering
    window.renderItems = function () {
        window.originalRenderItems();
        // Re-setup event listeners after re-render
        setupSharedViewEventListeners();
    };

    // Initial render
    renderItems();


    // Update Title to be clean
    detailTitle.innerText = list.title;
}

function importSharedList() {
    if (!window.sharedList) return;
    const list = window.sharedList;

    // Restore saveData
    if (window.originalSaveData) window.saveData = window.originalSaveData;

    // Check if already exists
    const exists = lists.some(l => l.id === list.id); // Original ID
    if (exists) {
        if (!confirm('您已经有这个检查单了，是否覆盖？')) {
            // Generate new ID
            list.id = Date.now();
            list.title += ' (副本)';
        } else {
            // Remove old
            lists = lists.filter(l => l.id !== list.id);
        }
    }

    // Ensure it's in lists (it might be there from renderSharedView, but let's be clean)
    // Remove the temporary one added in renderSharedView first
    lists = lists.filter(l => l.id !== currentListId); // currentListId might be the temp one

    lists.unshift(list);
    saveData();

    alert('检查单已保存！');
    window.location.href = window.location.pathname; // Reload to clear share param
}

// Expose functions to global scope for HTML onclick handlers
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
window.showCreateModal = showCreateModal;
window.closeModal = closeModal;
window.saveList = saveList;
window.selectColor = selectColor;
window.editList = editList;
window.deleteCurrentList = deleteCurrentList;
window.addItem = addItem;
window.toggleItemStatus = toggleItemStatus;
window.updateItemCount = updateItemCount;
window.deleteItem = deleteItem;
window.goHome = goHome;
window.openList = openList;

window.shareList = shareList;
window.importSharedList = importSharedList;

// Check for share URL on load
checkSharedUrl();
let syncTimeout = null;

const modalSettings = document.getElementById('modal-settings');
const modalSettingsContent = document.getElementById('modal-settings-content');
const syncStatus = document.getElementById('sync-status');

// Inputs
const s3EndpointInput = document.getElementById('s3-endpoint');
const s3RegionInput = document.getElementById('s3-region');
const s3BucketInput = document.getElementById('s3-bucket');
const s3AkInput = document.getElementById('s3-ak');
const s3SkInput = document.getElementById('s3-sk');

// Short URL Inputs
const shortUrlEnabledInput = document.getElementById('shorturl-enabled');
const shortUrlApiInput = document.getElementById('shorturl-api');
const shortUrlApiKeyInput = document.getElementById('shorturl-apikey');

// Use AWS SDK v2 (Global AWS object)

function getS3Client() {
    if (!s3Config) return null;
    if (s3Client) return s3Client;

    const config = {
        region: s3Config.region || 'us-east-1',
        credentials: new AWS.Credentials(s3Config.ak, s3Config.sk),
        // For V2, endpoint is handled differently if it's custom
    };

    if (s3Config.endpoint) {
        config.endpoint = new AWS.Endpoint(s3Config.endpoint);
        config.s3ForcePathStyle = true; // Needed for MinIO/R2
    }

    s3Client = new AWS.S3(config);
    return s3Client;
}

function showSettingsModal() {
    // Load S3 config
    if (s3Config) {
        s3EndpointInput.value = s3Config.endpoint || '';
        s3RegionInput.value = s3Config.region || '';
        s3BucketInput.value = s3Config.bucket || '';
        s3AkInput.value = s3Config.ak || '';
        s3SkInput.value = s3Config.sk || '';
    }

    // Load short URL config
    if (shortUrlConfig) {
        shortUrlEnabledInput.checked = shortUrlConfig.enabled || false;
        shortUrlApiInput.value = shortUrlConfig.apiUrl || '';
        shortUrlApiKeyInput.value = shortUrlConfig.apiKey || '';
    }

    modalSettings.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalSettingsContent.classList.remove('scale-95', 'opacity-0');
        modalSettingsContent.classList.add('scale-100', 'opacity-100');
    });
}

function closeSettingsModal() {
    modalSettingsContent.classList.remove('scale-100', 'opacity-100');
    modalSettingsContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modalSettings.classList.add('hidden'), 300);
}

function saveSettings() {
    // Save S3 config
    const newS3Config = {
        endpoint: s3EndpointInput.value.trim(),
        region: s3RegionInput.value.trim(),
        bucket: s3BucketInput.value.trim(),
        ak: s3AkInput.value.trim(),
        sk: s3SkInput.value.trim()
    };

    // Save short URL config
    const newShortUrlConfig = {
        enabled: shortUrlEnabledInput.checked,
        apiUrl: shortUrlApiInput.value.trim(),
        apiKey: shortUrlApiKeyInput.value.trim()
    };

    // Validate S3 config if any field is filled
    const hasS3Config = newS3Config.bucket || newS3Config.ak || newS3Config.sk;
    if (hasS3Config && (!newS3Config.bucket || !newS3Config.ak || !newS3Config.sk)) {
        alert('S3 配置不完整：Bucket、Access Key 和 Secret Key 都是必需的。');
        return;
    }

    // Save configs
    if (hasS3Config) {
        s3Config = newS3Config;
        localStorage.setItem('fileMemoS3Config', JSON.stringify(s3Config));
        s3Client = null; // Reset client
    }

    shortUrlConfig = newShortUrlConfig;
    localStorage.setItem('fileMemoShortUrlConfig', JSON.stringify(shortUrlConfig));

    closeSettingsModal();

    // Try to sync S3 if configured
    if (hasS3Config) {
        downloadData();
    }
}

async function uploadData() {
    if (!s3Config) return;

    updateSyncStatus('Saving...', true);

    try {
        const s3 = getS3Client();
        const params = {
            Bucket: s3Config.bucket,
            Key: 'data.json',
            Body: JSON.stringify(lists),
            ContentType: 'application/json'
        };

        await s3.putObject(params).promise();
        updateSyncStatus('Saved');
    } catch (err) {
        console.error('Upload failed', err);
        updateSyncStatus('Error', false, true);
    }
}

async function downloadData() {
    if (!s3Config) return;

    updateSyncStatus('Syncing...', true);

    try {
        const s3 = getS3Client();
        const params = {
            Bucket: s3Config.bucket,
            Key: 'data.json'
        };

        const data = await s3.getObject(params).promise();
        const str = data.Body.toString('utf-8');
        const remoteLists = JSON.parse(str);

        if (Array.isArray(remoteLists)) {
            lists = remoteLists;
            saveData(true); // Save to local but skip upload
            renderLists();
            if (currentListId) renderItems();
            updateSyncStatus('Synced');
        }
    } catch (err) {
        // V2 error code for missing key is usually 'NoSuchKey'
        if (err.code === 'NoSuchKey') {
            console.log('Remote file not found, uploading local data...');
            uploadData();
        } else if (err.message === 'Network Failure' || err.name === 'NetworkingError') {
            console.error('Download failed', err);
            updateSyncStatus('CORS/Network Error', false, true);
            alert('同步失败：可能是 CORS 配置问题。\n请在您的 S3 存储桶设置中允许 Origin: http://localhost:8000');
        } else {
            console.error('Download failed', err);
            updateSyncStatus('Error', false, true);
        }
    }
}

function updateSyncStatus(text, loading = false, error = false) {
    syncStatus.classList.remove('hidden');
    const icon = loading ? '<i class="fa-solid fa-circle-notch fa-spin"></i>' :
        error ? '<i class="fa-solid fa-circle-exclamation text-red-500"></i>' :
            '<i class="fa-solid fa-cloud"></i>';

    syncStatus.innerHTML = `${icon} <span class="truncate max-w-[100px]">${text}</span>`;

    if (error) {
        syncStatus.classList.add('text-red-500');
        syncStatus.title = "点击查看详情";
        syncStatus.onclick = () => alert('请检查控制台日志 (F12) 以获取详细错误信息。\n常见原因：CORS 未配置、密钥错误、网络不通。');
        syncStatus.style.cursor = 'pointer';
    } else {
        syncStatus.classList.remove('text-red-500');
        syncStatus.onclick = null;
        syncStatus.style.cursor = 'default';
        syncStatus.title = "";
    }
}

function saveData(skipUpload = false) {
    localStorage.setItem('fileMemoData_v7', JSON.stringify(lists));
    if (!skipUpload && s3Config) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(uploadData, 1000); // Debounce 1s
        updateSyncStatus('Pending...');
    }
}

// Initialize
if (s3Config) {
    downloadData();
}

renderLists();

// --- 拖拽交互 ---
function setupDragInteraction(itemId, listColorKey) {
    const target = document.getElementById(`drag-target-${itemId}`);
    if (!target) return;
    let startX = 0; let startValue = 0; let isDragging = false;

    const start = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        const list = lists.find(l => l.id === currentListId);
        const item = list.items.find(i => i.id === itemId);
        startValue = item ? item.count : 0;
        target.classList.add('scrubbing');
        document.body.style.cursor = 'ew-resize';
    };

    const move = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // 防止手机上拖拽时滚动页面
        const currentX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const diff = currentX - startX;
        const delta = Math.floor(diff / 15);
        let newValue = startValue + delta;
        if (newValue < 0) newValue = 0;
        const disp = document.getElementById(`disp-${itemId}`);
        if (disp) disp.innerText = newValue;
    };

    const end = (e) => {
        if (!isDragging) return;
        isDragging = false;
        target.classList.remove('scrubbing');
        document.body.style.cursor = 'default';
        const disp = document.getElementById(`disp-${itemId}`);
        if (disp) updateItemCount(itemId, parseInt(disp.innerText) - startValue);
    };

    target.addEventListener('mousedown', start);
    target.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
}

function shakeInput(el) {
    el.classList.add('translate-x-2', 'ring-2', 'ring-red-200');
    setTimeout(() => el.classList.remove('translate-x-2', 'ring-2', 'ring-red-200'), 200);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

itemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });
listNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveList(); });

// Resize Listener for Responsive switch
window.addEventListener('resize', () => {
    if (!isMobile() && currentListId) {
        // 如果切换到PC且有选中项，确保UI正确显示
        pcEmptyState.classList.remove('md:flex');
        detailContentWrapper.classList.remove('hidden', 'md:hidden');
        detailContentWrapper.classList.add('flex');
    } else if (!isMobile() && !currentListId) {
        pcEmptyState.classList.add('md:flex');
        detailContentWrapper.classList.add('hidden', 'md:hidden');
        detailContentWrapper.classList.remove('flex');
    }
});
