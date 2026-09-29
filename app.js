var CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Entertainment",
  "Education",
  "Other"
];

function formatCurrency(amount) {
  var value = Number(amount);

  if (!Number.isFinite(value)) {
    value = 0;
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  var date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  var toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(function() {
    toast.classList.remove("show");
  }, 2200);
}

async function getExpenses() {
  var response = await fetch("/api/expenses");

  if (!response.ok) {
    throw new Error("Failed to load expenses.");
  }

  return await response.json();
}

async function getExpense(id) {
  var response = await fetch("/api/expenses/" + encodeURIComponent(id));

  if (!response.ok) {
    throw new Error("Expense not found.");
  }

  return await response.json();
}

async function createExpense(expense) {
  var response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(expense)
  });

  if (!response.ok) {
    var error = await response.json().catch(function() {
      return {};
    });

    throw new Error(error.message || "Failed to save expense.");
  }

  return await response.json();
}

async function updateExpense(id, expense) {
  var response = await fetch(
    "/api/expenses/" + encodeURIComponent(id),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(expense)
    }
  );

  if (!response.ok) {
    var error = await response.json().catch(function() {
      return {};
    });

    throw new Error(error.message || "Failed to update expense.");
  }

  return await response.json();
}

async function deleteExpense(id) {
  var response = await fetch(
    "/api/expenses/" + encodeURIComponent(id),
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete expense.");
  }

  return await response.json();
}

function populateCategorySelect(select, includeAll) {
  if (!select) {
    return;
  }

  var currentValue = select.value;

  select.innerHTML = "";

  if (includeAll) {
    var allOption = document.createElement("option");

    allOption.value = "";
    allOption.textContent = "All categories";

    select.appendChild(allOption);
  }

  CATEGORIES.forEach(function(category) {
    var option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    select.appendChild(option);
  });

  if (currentValue) {
    select.value = currentValue;
  }
}

async function initDashboard() {
  var totalElement = document.getElementById("stat-total");
  var largestElement = document.getElementById("stat-largest");
  var countElement = document.getElementById("stat-count");
  var categoryRows = document.getElementById("category-rows");
  var recentRows = document.getElementById("recent-rows");
  var todayElement = document.getElementById("today-date");

  if (
    !totalElement &&
    !largestElement &&
    !countElement &&
    !categoryRows &&
    !recentRows
  ) {
    return;
  }

  try {
    var expenses = await getExpenses();

    var total = expenses.reduce(function(sum, expense) {
      return sum + Number(expense.amount || 0);
    }, 0);

    var largest = expenses.reduce(function(max, expense) {
      return Math.max(max, Number(expense.amount || 0));
    }, 0);

    if (totalElement) {
      totalElement.textContent = formatCurrency(total);
    }

    if (largestElement) {
      largestElement.textContent = formatCurrency(largest);
    }

    if (countElement) {
      countElement.textContent = expenses.length;
    }

    if (todayElement) {
      todayElement.textContent = formatToday();
    }

    renderCategoryBreakdown(expenses, categoryRows);
    renderRecentExpenses(expenses, recentRows);

  } catch (error) {
    console.error(error);
    showToast("Unable to load expenses.");
  }
}

function renderCategoryBreakdown(expenses, container) {
  if (!container) {
    return;
  }

  if (expenses.length === 0) {
    container.innerHTML =
      '<div class="cat-empty">No expenses recorded yet.</div>';

    return;
  }

  var totals = {};

  CATEGORIES.forEach(function(category) {
    totals[category] = 0;
  });

  expenses.forEach(function(expense) {
    var category = CATEGORIES.includes(expense.category)
      ? expense.category
      : "Other";

    totals[category] += Number(expense.amount || 0);
  });

  var max = Math.max.apply(
    null,
    Object.keys(totals).map(function(category) {
      return totals[category];
    })
  );

  container.innerHTML = CATEGORIES.map(function(category) {
    var amount = totals[category];

    var width = max > 0
      ? (amount / max) * 100
      : 0;

    return `
      <div class="cat-row">
        <div class="cat-name">
          ${escapeHTML(category)}
        </div>

        <div class="cat-bar">
          <div
            class="cat-bar-fill"
            style="width:${width}%"
          ></div>
        </div>

        <div class="cat-amount mono">
          ${formatCurrency(amount)}
        </div>
      </div>
    `;
  }).join("");
}

function renderRecentExpenses(expenses, container) {
  if (!container) {
    return;
  }

  var recent = expenses
    .slice()
    .sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:28px 0;">
          No expenses recorded yet.
        </td>
      </tr>
    `;

    return;
  }

  container.innerHTML = recent.map(function(expense) {
    return `
      <tr>
        <td class="date">
          ${escapeHTML(formatDate(expense.date))}
        </td>

        <td>
          ${escapeHTML(expense.description)}
        </td>

        <td>
          <span class="pill">
            ${escapeHTML(expense.category)}
          </span>
        </td>

        <td class="num">
          ${formatCurrency(expense.amount)}
        </td>
      </tr>
    `;
  }).join("");
}

async function initExpensesPage() {
  var rows = document.getElementById("rows");
  var filter = document.getElementById("filter");
  var empty = document.getElementById("empty");
  var table = document.getElementById("table");

  if (!rows || !filter) {
    return;
  }

  populateCategorySelect(filter, true);

  async function render() {
    try {
      var expenses = await getExpenses();

      if (filter.value) {
        expenses = expenses.filter(function(expense) {
          return expense.category === filter.value;
        });
      }

      expenses.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      if (expenses.length === 0) {
        rows.innerHTML = "";

        if (table) {
          table.style.display = "none";
        }

        if (empty) {
          empty.style.display = "block";
        }

        return;
      }

      if (table) {
        table.style.display = "table";
      }

      if (empty) {
        empty.style.display = "none";
      }

      rows.innerHTML = expenses.map(function(expense) {
        return `
          <tr>
            <td class="date">
              ${escapeHTML(formatDate(expense.date))}
            </td>

            <td>
              ${escapeHTML(expense.description)}
            </td>

            <td>
              <span class="pill">
                ${escapeHTML(expense.category)}
              </span>
            </td>

            <td class="num">
              ${formatCurrency(expense.amount)}
            </td>

            <td>
              <div class="row-actions">

                <a
                  class="icon-link"
                  href="expense-form.html?id=${encodeURIComponent(expense.id)}"
                >
                  Edit
                </a>

                <button
                  type="button"
                  class="icon-link danger delete-expense"
                  data-id="${escapeHTML(expense.id)}"
                  style="background:none;border:0;padding:0;font:inherit;cursor:pointer;"
                >
                  Delete
                </button>

              </div>
            </td>
          </tr>
        `;
      }).join("");

      rows
        .querySelectorAll(".delete-expense")
        .forEach(function(button) {
          button.addEventListener("click", async function() {
            var id = button.getAttribute("data-id");

            var confirmed = confirm(
              "Are you sure you want to delete this expense?"
            );

            if (!confirmed) {
              return;
            }

            try {
              await deleteExpense(id);

              showToast("Expense deleted.");

              await render();

            } catch (error) {
              console.error(error);
              showToast("Unable to delete expense.");
            }
          });
        });

    } catch (error) {
      console.error(error);
      showToast("Unable to load expenses.");
    }
  }

  filter.addEventListener("change", render);

  await render();
}

function getExpenseIdFromURL() {
  var params = new URLSearchParams(window.location.search);

  return params.get("id");
}

async function initExpenseForm() {
  var form = document.getElementById("expense-form");
  var category = document.getElementById("category");
  var description = document.getElementById("description");
  var amount = document.getElementById("amount");
  var date = document.getElementById("date");
  var title = document.getElementById("form-title");
  var submitButton = document.getElementById("submit-btn");

  if (
    !form ||
    !category ||
    !description ||
    !amount ||
    !date
  ) {
    return;
  }

  populateCategorySelect(category, false);

  var editId = getExpenseIdFromURL();

  var editingExpense = null;

  if (editId) {
    try {
      editingExpense = await getExpense(editId);

      if (title) {
        title.textContent = "Edit expense";
      }

      if (submitButton) {
        submitButton.textContent = "Update expense";
      }

      description.value =
        editingExpense.description || "";

      amount.value =
        Number(editingExpense.amount || 0).toFixed(2);

      date.value =
        editingExpense.date
          ? String(editingExpense.date).substring(0, 10)
          : "";

      category.value =
        editingExpense.category || CATEGORIES[0];

    } catch (error) {
      console.error(error);
      showToast("Expense not found.");
    }
  }

  if (!date.value) {
    var now = new Date();

    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");

    date.value = year + "-" + month + "-" + day;
  }

  form.addEventListener("submit", async function(event) {
    event.preventDefault();

    clearFormErrors();

    var descriptionValue =
      description.value.trim();

    var amountValue =
      Number(amount.value);

    var dateValue =
      date.value;

    var categoryValue =
      category.value;

    var valid = true;

    if (!descriptionValue) {
      setFormError(
        "description",
        "Please enter a description."
      );

      valid = false;
    }

    if (
      !Number.isFinite(amountValue) ||
      amountValue <= 0
    ) {
      setFormError(
        "amount",
        "Amount must be greater than ₱0.00."
      );

      valid = false;
    }

    if (!dateValue) {
      setFormError(
        "date",
        "Please select a date."
      );

      valid = false;
    }

    if (!CATEGORIES.includes(categoryValue)) {
      valid = false;
    }

    if (!valid) {
      return;
    }

    var expenseData = {
      description: descriptionValue,
      amount: Number(amountValue.toFixed(2)),
      date: dateValue,
      category: categoryValue
    };

    try {
      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          expenseData
        );

        showToast("Expense updated.");

      } else {
        await createExpense(expenseData);

        showToast("Expense saved.");

        form.reset();

        category.value = CATEGORIES[0];

        var now = new Date();

        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, "0");
        var day = String(now.getDate()).padStart(2, "0");

        date.value =
          year + "-" + month + "-" + day;
      }

      setTimeout(function() {
        window.location.href = "expenses.html";
      }, 500);

    } catch (error) {
      console.error(error);

      showToast(
        error.message || "Something went wrong."
      );
    }
  });
}

function setFormError(fieldName, message) {
  var error =
    document.getElementById(
      "err-" + fieldName
    );

  if (error) {
    error.textContent = message;
  }
}

function clearFormErrors() {
  document
    .querySelectorAll(".error-msg")
    .forEach(function(element) {
      element.textContent = "";
    });
}

document.addEventListener(
  "DOMContentLoaded",
  function() {
    initDashboard();
    initExpensesPage();
    initExpenseForm();
  }
);