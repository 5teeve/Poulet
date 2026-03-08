const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const lotRoutes = require("./src/routes/lotRoutes");
const raceRoutes = require("./src/routes/raceRoutes");
const incubationRoutes = require("./src/routes/incubationRoutes");
const ventePouletRoutes = require("./src/routes/ventePouletRoutes");
const venteOeufRoutes = require("./src/routes/venteOeufRoutes");
const suiviCroissanceRoutes = require("./src/routes/suiviCroissanceRoutes");
const pondageRoutes = require("./src/routes/pondageRoutes");
const stockOeufRoutes = require("./src/routes/stockOeufRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Backend OK");
})

app.use("/api/lots", lotRoutes);
app.use("/api/races", raceRoutes);
app.use("/api/incubations", incubationRoutes);
app.use("/api/vente-poulets", ventePouletRoutes);
app.use("/api/vente-oeufs", venteOeufRoutes);
app.use("/api/suivi-croissance", suiviCroissanceRoutes);
app.use("/api/pondages", pondageRoutes);
app.use("/api/stock-oeufs", stockOeufRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.listen(3000, ()=> console.log("Server running on port 3000"));