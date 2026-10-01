const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "expense_tracker"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully.");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Simple API health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Expense Tracker API is running."
    });
});

// Get all expenses
app.get("/api/expenses", (req, res) => {
    const sql = `
        SELECT
            id,
            description,
            amount,
            date,
            category,
            created_at
        FROM expenses
        ORDER BY date DESC, id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to load expenses."
            });
        }

        res.json(results);
    });
});

// Get one expense
app.get("/api/expenses/:id", (req, res) => {
    const sql = `
        SELECT
            id,
            description,
            amount,
            date,
            category,
            created_at
        FROM expenses
        WHERE id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to load expense."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.json(results[0]);
    });
});

// Add new expense
app.post("/api/expenses", (req, res) => {
    let {
        description,
        amount,
        date,
        category
    } = req.body;

    // Remove unnecessary spaces
    description = description?.trim();
    category = category?.trim();

    if (
        !description ||
        amount === undefined ||
        !date ||
        !category
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({
            message: "Amount must be a valid positive number."
        });
    }

    const sql = `
        INSERT INTO expenses
        (description, amount, date, category)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            description,
            amount,
            date,
            category
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to save expense."
                });
            }

            res.status(201).json({
                id: result.insertId,
                description,
                amount,
                date,
                category
            });
        }
    );
});

// Update expense
app.put("/api/expenses/:id", (req, res) => {
    let {
        description,
        amount,
        date,
        category
    } = req.body;

    // Remove unnecessary spaces
    description = description?.trim();
    category = category?.trim();

    if (
        !description ||
        amount === undefined ||
        !date ||
        !category
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({
            message: "Amount must be a valid positive number."
        });
    }

    const sql = `
        UPDATE expenses
        SET
            description = ?,
            amount = ?,
            date = ?,
            category = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            description,
            amount,
            date,
            category,
            req.params.id
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to update expense."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Expense not found."
                });
            }

            res.json({
                id: req.params.id,
                description,
                amount,
                date,
                category
            });
        }
    );
});

// Delete expense
app.delete("/api/expenses/:id", (req, res) => {
    const sql = `
        DELETE FROM expenses
        WHERE id = ?
    `;

    db.query(
        sql,
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to delete expense."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Expense not found."
                });
            }

            res.json({
                message: "Expense deleted successfully."
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Expense Tracker server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
});

