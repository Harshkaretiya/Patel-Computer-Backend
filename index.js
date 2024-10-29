import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const db = new pg.Client({
    
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
db.connect();




app.use(cors()); // Allows all origins by default; specify options for more control
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/categories", async (req, res) => {
    try {
        // const result = await db.query("SELECT c.* FROM categories c INNER JOIN products p ON c.category_id = p.categoryid;");
        const result = await db.query("SELECT * FROM categories c WHERE EXISTS (SELECT 1 FROM products p WHERE p.categoryid = c.category_id);");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
app.get("/", async (req, res) => {
    try {
       
        res.json({asd:"asdasd"});
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

app.post("/products", async (req, res) => {
    const { categoryid } = req.body;
    try {
        const result = await db.query(
            `SELECT p.*, c.category_name FROM products p JOIN categories c ON p.categoryid = c.category_id WHERE p.categoryid = $1`,
            [categoryid]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});


app.post("/productid", async (req, res) => {
    const { productId } = req.body;
    try {
        const result = await db.query(
            "SELECT * FROM products WHERE id = $1",
            [productId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

app.delete("/productdelete/:productId", async (req, res) => {
    const { productId } = req.params;  // Access productId from URL parameter
    try {
        const result = await db.query(
            "DELETE FROM products WHERE id = $1 RETURNING *",
            [productId]
        );
        
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Product not found" });
        } else {
            res.status(200).json({ message: "Product deleted successfully", product: result.rows[0] });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

app.delete("/querydelete/:queryId", async (req, res) => {
    const { queryId } = req.params;  
    try {
        const result = await db.query(
            "DELETE FROM queries WHERE id = $1 RETURNING *",
            [queryId]
        );
        
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Product not found" });
        } else {
            res.status(200).json({ message: "Product deleted successfully", product: result.rows[0] });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

app.post("/newquery", async (req, res) => {
    const { fullname, number, description } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO queries (fullname, number, description) VALUES ($1, $2, $3) RETURNING *",
            [fullname, number, description]
        );
        res.status(201).json({ message: "Query submitted successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Error submitting query:", error);
        res.status(500).json({ error: "Failed to submit query" });
    }
});

app.post("/newproduct", async (req, res) => {
    const { name, description, imageurl ,categoryid} = req.body;
    try {
        const result = await db.query(
            "INSERT INTO products (name, description, imageurl, categoryid) VALUES ($1, $2, $3, $4)",
            [name, description, imageurl,categoryid]
        );
        res.status(201).json({ message: "Query submitted successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Error submitting query:", error);
        res.status(500).json({ error: "Failed to submit query" });
    }
});
app.put("/updateproduct", async (req, res) => {
    const { productid, name, description, imageurl, categoryid } = req.body; // Extract fields from request body

    try {
        const result = await db.query(
            "UPDATE products SET name = $1, description = $2, imageurl = $3, categoryid = $4 WHERE id = $5",
            [name, description, imageurl, categoryid, productid] // Use the productId to find the correct row
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Product not found" }); // Handle case where product doesn't exist
        }

        res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});


app.post("/getqueries", async (req, res) => {
    const {archived} = req.body;
    try {
        const result = await db.query("SELECT * FROM queries WHERE archived = $1 ORDER BY created_at DESC;",[archived]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving queries:", error);
        res.status(500).json({ error: "Failed to retrieve queries" });
    }
});
app.post("/getqueriesbyid", async (req, res) => {
    const { queryId } = req.body;
    try {
        const result = await db.query("SELECT * FROM queries WHERE id = $1",[queryId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving queries:", error);
        res.status(500).json({ error: "Failed to retrieve queries" });
    }
});

app.put("/updatearchived", async (req, res) => {
    const { archived,queryId } = req.body; // Get the new archived value from the request body

    try {
        const result = await db.query(
            "UPDATE queries SET archived = $1 WHERE id = $2 RETURNING *",
            [archived, queryId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Query not found" });
        }

        res.status(200).json({
            sucsess: true,
            data: result.rows[0], // Return the updated query
        });
    } catch (error) {
        console.error("Error updating query:", error);
        res.status(500).json({ error: "Failed to update query" });
    }
});



app.listen(3000,()=>{
    console.log("server si running on port 3000");
});
