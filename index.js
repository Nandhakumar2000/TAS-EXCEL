const express = require("express");
const sql = require("mssql");

const app = express();
const port = 3003;

const config = {
  user: "sql6691798",
  password: "gglFIeiRs2",
  server: "sql6.freesqldatabase.com",
  database: "sql6691798",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true, // for azure
      trustServerCertificate: false // change to true for local dev / self-signed certs
    }
  }

// var config = {
//   user: "sql6691798",
//   password: "gglFIeiRs2",
//   server: "sql6.freesqldatabase.com",
// //  database: "sql6691798",
//  // port: 3306,
//   options: {
//  //   trustServerCertificate: true,
//   },
// };

// const XlsxPopulate = require('xlsx-populate');

// // Load the workbook
// XlsxPopulate.fromFileAsync('TEST.xlsx')
//     .then(workbook => {
//         // Get the first sheet
//         const sheet = workbook.sheet(0);

//         // Update cell E5
//         sheet.cell('E5').value('New Value');

//         // Write the workbook back to the file
//         return workbook.toFileAsync('TEST.xlsx');
//     });

function logMessage() {
    //Select the data's to be updated
    // console.log("Cron job executed at:", new Date().toLocaleString());
    new sql.Request().query(
        "SELECT * FROM TANKDATA WHERE postStatus = 'NEW'",
        function (err, result) {
        if (err) throw err;
        if (result?.recordset?.length > 0) {
           console.log("result", result.recordset);
        }
        }
    );
    }

app.get("/", (req, res) => {
    res.send(`App is Runnig on port ${port}!`);
});
      

app.listen(port, async () => {
    console.log(`Node App listening at url http://localhost:${port}`);
    await sql
    .connect(config)
    .then((pool) => {
        console.log("DB Connected!");
    })
    .catch((err) => {
        console.log("err", err);
        throw err;
    });
});
