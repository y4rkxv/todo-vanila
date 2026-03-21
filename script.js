class Todo {
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTask: '[data-js-todo-total-task]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckBox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-item-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  };

  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
    isEditing: 'is-editing',
  };

  localStorageKey = 'todo-items';

  constructor() {
    this.rootElement = document.querySelector(this.selectors.root);
    this.newTaskFormElement = this.rootElement.querySelector(
      this.selectors.newTaskForm,
    );
    this.newTaskInputElement = this.rootElement.querySelector(
      this.selectors.newTaskInput,
    );
    this.searchTaskFormElement = this.rootElement.querySelector(
      this.selectors.searchTaskForm,
    );
    this.searchTaskInputElement = this.rootElement.querySelector(
      this.selectors.searchTaskInput,
    );
    this.totalTaskElement = this.rootElement.querySelector(
      this.selectors.totalTask,
    );
    this.deleteAllButtonElement = this.rootElement.querySelector(
      this.selectors.deleteAllButton,
    );
    this.listElement = this.rootElement.querySelector(this.selectors.list);
    this.emptyMessageElement = this.rootElement.querySelector(
      this.selectors.emptyMessage,
    );

    this.state = {
      items: this.getItemsFromLocalStorage(),
      filteredItems: null,
      searchQuery: '',
    };

    this.render();
    this.bindEvents();
  }

  getItemsFromLocalStorage() {
    const rawData = localStorage.getItem(this.localStorageKey);

    if (!rawData) {
      return [];
    }
    try {
      const parsedData = JSON.parse(rawData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch {
      console.log('Todo items parse error');
      return [];
    }
  }

  saveItemsToLocalStorage() {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.state.items),
    );
  }

  render() {
    this.totalTaskElement.textContent = this.state.items.length;

    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible,
      this.state.items.length > 0,
    );

    const items = this.state.filteredItems ?? this.state.items;

    this.listElement.innerHTML = items
      .map(
        ({ id, title, isChecked }) => `
          <li class="todo__item todo-item" data-js-todo-item>
            <input
              class="todo-item__checkbox"
              id="${id}"
              type="checkbox" ${isChecked ? 'checked' : ''}
              data-js-todo-item-checkbox
            />
            <label class="todo-item__label" for="${id}" data-js-todo-item-label
              >${title}</label>
            <button
              class="todo-item__delete-button"
              type="button"
              aria-label="Delete"
              title="Delete"
              data-js-todo-item-delete-button
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="#757575"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
        `,
      )
      .join('');

    const isEmptyFilteredItems = this.state.filteredItems?.length === 0;
    const isEmptyItems = this.state.items.length === 0;

    this.emptyMessageElement.textContent = isEmptyFilteredItems
      ? 'Tasks not found'
      : isEmptyItems
        ? 'There are no tasks yet'
        : '';
  }

  editItem(id) {
    const itemElement = this.listElement
      .querySelector(`[data-js-todo-item-checkbox][id="${id}"]`)
      ?.closest(this.selectors.item);
    if (!itemElement) return;

    const labelElement = itemElement.querySelector(this.selectors.itemLabel);
    const item = this.state.items.find(i => i.id === id);
    if (!item || !labelElement) return;

    const input = document.createElement('input');
    input.className = 'todo-item__edit-input';
    input.value = item.title;
    input.setAttribute('data-js-todo-item-edit-input', '');
    labelElement.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const newTitle = input.value.trim();
      if (newTitle.length > 0 && newTitle !== item.title) {
        this.state.items = this.state.items.map(i =>
          i.id === id ? { ...i, title: newTitle } : i,
        );
        this.saveItemsToLocalStorage();
      }
      this.render();
    };

    input.addEventListener('blur', save, { once: true });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
      if (e.key === 'Escape') {
        input.removeEventListener('blur', save);
        this.render();
      }
    });
  }

  addItem(title) {
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    });
    this.saveItemsToLocalStorage();
    this.render();
  }

  deleteItem(id) {
    this.state.items = this.state.items.filter(item => item.id !== id);
    this.saveItemsToLocalStorage();
    this.render();
  }

  toggleCheckedState(id) {
    this.state.items = this.state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isChecked: !item.isChecked,
        };
      }
      return item;
    });
    this.saveItemsToLocalStorage();
    this.render();
  }

  filter() {
    const queryFormatted = this.state.searchQuery.toLowerCase();

    this.state.filteredItems = this.state.items.filter(({ title }) => {
      const titleFormatted = title.toLowerCase();
      return titleFormatted.includes(queryFormatted);
    });
    this.render();
  }

  resetFilter() {
    this.state.filteredItems = null;
    this.state.searchQuery = '';
    this.render();
  }

  onNewTaskFormSubmit = event => {
    event.preventDefault();

    const newTodoItemTitle = this.newTaskInputElement.value;

    if (newTodoItemTitle.trim().length > 0) {
      this.addItem(newTodoItemTitle);
      this.resetFilter();
      this.newTaskInputElement.value = '';
      this.newTaskInputElement.focus();
    }
  };

  onTaskFormSubmit = event => {
    event.preventDefault();
  };

  onSearchTaskInputChange = ({ target }) => {
    const value = target.value.trim();
    if (value.length > 0) {
      this.state.searchQuery = value;
      this.filter();
    } else {
      this.resetFilter();
    }
  };

  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Are you sure you want to delete all?');
    if (isConfirmed) {
      this.state.items = [];
      this.saveItemsToLocalStorage();
      this.render();
    }
  };

  onClick = ({ target }) => {
    if (target.matches(this.selectors.itemDeleteButton)) {
      const itemElement = target.closest(this.selectors.item);
      const itemCheckBoxElement = itemElement.querySelector(
        this.selectors.itemCheckBox,
      );

      itemElement.classList.add(this.stateClasses.isDisappearing);

      setTimeout(() => {
        this.deleteItem(itemCheckBoxElement.id);
      }, 400);
    }
  };

  onDblClick = ({ target }) => {
    const label = target.closest(this.selectors.itemLabel);
    if (!label) return;
    const itemElement = label.closest(this.selectors.item);
    const checkboxEl = itemElement?.querySelector(this.selectors.itemCheckBox);
    if (checkboxEl) this.editItem(checkboxEl.id);
  };

  onChange = ({ target }) => {
    if (target.matches(this.selectors.itemCheckBox)) {
      this.toggleCheckedState(target.id);
    }
  };

  bindEvents() {
    this.newTaskFormElement.addEventListener(
      'submit',
      this.onNewTaskFormSubmit,
    );
    this.searchTaskFormElement.addEventListener(
      'submit',
      this.onTaskFormSubmit,
    );
    this.searchTaskInputElement.addEventListener(
      'input',
      this.onSearchTaskInputChange,
    );
    this.deleteAllButtonElement.addEventListener(
      'click',
      this.onDeleteAllButtonClick,
    );
    this.listElement.addEventListener('click', this.onClick);
    this.listElement.addEventListener('dblclick', this.onDblClick);
    this.listElement.addEventListener('change', this.onChange);
  }
}

new Todo();
