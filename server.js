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

app.post("/api/expenses", (req, res) => {
    const {
        description,
        amount,
        date,
        category
    } = req.body;

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

app.put("/api/expenses/:id", (req, res) => {
    const {
        description,
        amount,
        date,
        category
    } = req.body;

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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});