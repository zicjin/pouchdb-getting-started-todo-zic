(function() {
  var ENTER_KEY = 13;
  var newTodoDom = document.getElementById('new-todo');
  var syncDom = document.getElementById('sync-wrapper');
  var db = new PouchDB('todos');

  // Replace with remote instance, this just replicates to another local instance.
  var remoteCouch = false;

  newTodoDom.addEventListener('keypress', function(event) {
    if (event.keyCode === ENTER_KEY) {
      var todo = {
        _id: new Date().toISOString(),
        title: newTodoDom.value,
        completed: false
      };
      db.put(todo, function callback(err, result) {
        if (!err) {
          console.log('Successfully posted a todo!');
        }
        newTodoDom.value = '';
      });
    }
  }, false);

  function showTodos() {
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
      var ul = document.getElementById('todo-list');
      ul.innerHTML = '';
      doc.rows.forEach(function(todo) {
        ul.appendChild(createTodoListItem(todo.doc));
      });
    });
  }

  db.changes({
    since: 'now',
    live: true
  }).on('change', showTodos);

  showTodos();

  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function() {
      todo.completed = event.target.checked;
      db.put(todo);
    });

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.title));
    label.addEventListener('dblclick', function () {
      document.getElementById('li_' + todo._id).className = 'editing';
      document.getElementById('input_' + todo._id).focus();
    });

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener('click', function() {
      db.remove(todo);
    });

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo._id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.title;
    inputEditTodo.addEventListener('keypress', function(e) {
      if (e.keyCode === ENTER_KEY) {
        inputEditTodo.blur();
      }
    });
    inputEditTodo.addEventListener('blur', function(e) {
      var trimmedText = e.target.value.trim();
      if (!trimmedText) {
        db.remove(todo);
      } else {
        todo.title = trimmedText;
        db.put(todo);
      }
    });

    var li = document.createElement('li');
    li.id = 'li_' + todo._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }

  if (remoteCouch) {
    syncDom.setAttribute('data-sync-state', 'syncing');
    function syncError() {
      syncDom.setAttribute('data-sync-state', 'error');
    }
    db.replicate.to(remoteCouch, { live: true }, syncError);
    db.replicate.from(remoteCouch, { live: true }, syncError);
  }

})();
