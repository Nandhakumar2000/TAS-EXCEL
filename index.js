const express = require("express");
const sql = require("mssql");
var fs = require('fs');  
var url = require('url');  
const XlsxPopulate = require('xlsx-populate');
var http = require('http');

const app = express();
const port = 3000;

const config = {
    user: "nandha",
    password: "Nandhu12345",
    server: "tas.czi8i44g0r2m.ap-south-1.rds.amazonaws.com",
    database: "TFMS",
    options: {
      trustServerCertificate: true,
    },
  }

  function toUtcDate(dateString) {
    let date = new Date(dateString + 'Z');
    return date.toISOString();
}

    var server = http.createServer(async function(request, response) {  
        var path = url.parse(request.url).pathname;  
        // console.log("path",url.parse(request.url))
        switch (path) {   
            case '/':  
                fs.readFile(__dirname + "/form.html", function(error, data) {  
                    if (error) {  
                        console.log("Error", error);
                        response.writeHead(404);  
                        response.write(error);  
                        response.end();  
                    } else {  
                        response.writeHead(200, {  
                            'Content-Type': 'text/html'  
                        });  
                        response.write(data);  
                        response.end();  
                    }  
                }); 
                break;
            case '/data':  
                fs.readFile(__dirname + "/data.html", function(error, data) {  
                    if (error) {  
                        console.log("Error", error);
                        response.writeHead(404);  
                        response.write(error);  
                        response.end();  
                    } else {  
                        response.writeHead(200, {  
                            'Content-Type': 'text/html'  
                        });  
                        response.write(data);  
                        response.end();  
                    }  
                }); 
                break;  
            case '/get_data':
                var queryData = url.parse(request.url, true).query; 
                console.log("queryData.sDate", toUtcDate(queryData.sDate).replace('Z','').replace('T',' '));
                console.log("queryData.eDate", toUtcDate(queryData.sDate)); 
                console.log("fileName", queryData.fileName);
                
                new sql.Request()
                .input('sDate', sql.NVarChar, toUtcDate(queryData.sDate).replace('Z','').replace('T',' '))
                .input('eDate', sql.NVarChar, toUtcDate(queryData.eDate).replace('Z','').replace('T',' '))
                .input('tNo', sql.Int, queryData.tNo)
                .query(
                    `
                    SELECT * FROM (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY CAST(REPORTDATE AS NVARCHAR(50)) ORDER BY (SELECT NULL)) as rn
                        FROM HIST
                        WHERE CAST(REPORTDATE AS NVARCHAR(50)) BETWEEN @sDate AND @eDate AND DID = @tNo
                    ) t
                    WHERE rn = 1
                `,
                    function (err, result) {
                    if (err) throw err;
                    if (result?.recordset?.length == 2) {
                       const sdata = result.recordset[0];
                       const edata = result.recordset[1];
                    XlsxPopulate.fromFileAsync(`${queryData.fileName}.xlsx`)
                        .then(workbook => {
                            const sheet = workbook.sheet(0);
                            sheet.cell('E8').value('Hello'); // Date
                            sheet.cell('E9').value(queryData.sDate); // Time
                            sheet.cell('E11').value(sdata['PRIMARYLVL']); // Gross Dip
                            sheet.cell('E12').value(sdata['TEMP']); // TEMP
                            sheet.cell('E21').value(sdata['DENSITY']); // DENSITY
                            sheet.cell('E26').value(sdata['BSW']); // S+W
                            sheet.cell('E27').value(sdata['WATERLVL']); // WATER

                            sheet.cell('G8').value(queryData.eDate); // Date
                            sheet.cell('G9').value(queryData.eDate); // Time
                            sheet.cell('G11').value(edata['PRIMARYLVL']); // Gross Dip
                            sheet.cell('G12').value(edata['TEMP']); // TEMP
                            sheet.cell('G21').value(edata['DENSITY']); // DENSITY
                            sheet.cell('G26').value(edata['BSW']); // S+W
                            sheet.cell('G27').value(edata['WATERLVL']); // WATER
                            console.log("written")
                            return workbook.toFileAsync(`${queryData.fileName}1.xlsx`);
                        }).then(() => {
                       response.writeHead(200, {  
                            'Content-Type': 'application/json'  
                        });
                        response.write(JSON.stringify(result.recordset));  
                        response.end(); 
                        }).catch((err)=>{
                            console.log("err", err);
                        })
                    }
                    }
                );
                break;    
            default:  
                response.writeHead(404);  
                response.write("opps this doesn't exist - 404");  
                response.end();  
                break;  
        }  
    });  

// app.get("/", (req, res) => {
//     res.send(`App is Runnig on port ${port}!`);
// });
      
sql
.connect(config)
.then((pool) => {
    console.log("DB Connected!");
})
.catch((err) => {
    console.log("err", err);
    throw err;
});

server.listen(8082);

console.log("Server is running on Port::8082");

// server.listen(port, async () => {
//     console.log(`Node App listening at url http://localhost:${port}`);
//     await sql
//     .connect(config)
//     .then((pool) => {
//         console.log("DB Connected!");
//         logMessage();
//     })
//     .catch((err) => {
//         console.log("err", err);
//         throw err;
//     });
// });


case '/get_device_data':
                    var queryData = url.parse(request.url, true).query; 
                    console.log("queryData.sDate", queryData.sDate); 
                    console.log("queryData.eDate", queryData.eDate); 
        
                    try {
                    const result = await connection.execute(`SELECT DISTINCT DEVICENAME FROM HIST`,
                         [],
                        {});
                  
                      console.log("Query metadata:", result.metaData);
                      console.log("Query rows:", result.rows);
                  
                      response.writeHead(200, {  
                        'Content-Type': 'application/json'  
                    });
                    response.write(JSON.stringify(result.rows));  
                    response.end(); 
        
                    } catch (err) {
                      console.error(err);
                    } finally {
                      if (connection) {
                        try {
                          // Connections should always be released when not needed
                          await connection.close();
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }
                    break; 

const pathimg = require('path');
 case '/tas.jpg':  
                const imagePath = pathimg.join(__dirname, 'IMG.jpg');
                const imageStream = fs.createReadStream(imagePath);
                response.writeHead(200, {'Content-Type': 'image/jpeg' });
                imageStream.pipe(response);
                break;
