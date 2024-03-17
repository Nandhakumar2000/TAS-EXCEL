const express = require("express");
const sql = require("mssql");
var fs = require('fs');  
var url = require('url');  
const XlsxPopulate = require('xlsx-populate');
var http = require('http');
const pathimg = require('path');
const {exec} = require('child_process');

const config = {
    user: "sa",
    password: "ssmits",
    server: "TFMS1",
    database: "TFMS",
    options: {
      trustServerCertificate: true,
      encrypt: false,
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
                .query(
                    `
                    SELECT * FROM (
                        SELECT *, ROW_NUMBER() OVER(PARTITION BY REPORTDATE ORDER BY (SELECT NULL)) as rn
                        FROM HIST
                        WHERE REPORTDATE BETWEEN '${toUtcDate(queryData.sDate).replace('Z','').replace('T',' ')}' AND '${toUtcDate(queryData.eDate).replace('Z','').replace('T',' ')}' AND DEVICENAME = '${queryData.tNo}'
                    ) t
                    WHERE rn = 1
                `,
                    function (err, result) {
                    if (err) throw err;
                    console.log('result', result);
                    if (result?.recordset?.length == 2) {
                       const sdata = result.recordset[0];
                       const edata = result.recordset[1];
                    XlsxPopulate.fromFileAsync(`${queryData.fileName}.xlsx`)
                        .then(workbook => {
                          //  const sheet = workbook.sheet(0);
                            const sheet = workbook.addSheet("New");
                            sheet.cell('E4').value(`Tank No : ${queryData.tNo}`)
                            sheet.cell('F32').value(`Tank No : ${queryData.tNo}`)
                            sheet.cell('E8').value(new Date(queryData.sDate).getDate() + "." + new Date(queryData.sDate).getMonth() + '.'+ new Date(queryData.sDate).getFullYear()); // Date
                            sheet.cell('E9').value(new Date(queryData.sDate).getHours() + ":" + new Date(queryData.sDate).getMinutes()); // Time
                            sheet.cell('E11').value(sdata['PRIMARYLVL']); // Gross Dip
                            sheet.cell('E13').value(sdata['TEMP']); // TEMP
                            sheet.cell('E21').value(sdata['DENSITY']); // DENSITY
                            sheet.cell('E26').value(sdata['BSW']); // S+W
                            sheet.cell('E27').value(sdata['WATERLVL']); // WATER

                            sheet.cell('G8').value(new Date(queryData.eDate).getDate() + "." + new Date(queryData.eDate).getMonth() + '.'+ new Date(queryData.eDate).getFullYear()); // Date
                            sheet.cell('G9').value(new Date(queryData.eDate).getHours() + ":" + new Date(queryData.eDate).getMinutes()); // Time
                            sheet.cell('G11').value(edata['PRIMARYLVL']); // Gross Dip
                            sheet.cell('G13').value(edata['TEMP']); // TEMP
                            sheet.cell('G21').value(edata['DENSITY']); // DENSITY
                            sheet.cell('G26').value(edata['BSW']); // S+W
                            sheet.cell('G27').value(edata['WATERLVL']); // WATER
                            let path = `../../Reports/${queryData.fileName}-${new Date(queryData.sDate).getDate() + "-" + new Date(queryData.sDate).getMonth() + '-'+ new Date(queryData.sDate).getFullYear() + "--" + new Date(queryData.eDate).getDate() + "." + new Date(queryData.eDate).getMonth() + '.'+ new Date(queryData.eDate).getFullYear() + "__" + Math.floor(Math.random() * 10000)}.xlsx`;
                             workbook.toFileAsync(path).then(()=>{
                              
                                    exec(`start excel ${path}`, (err, stdout, stderr)=>
                                    {
                                        if(err){
                                            console.log("err", err);
                                        } else{
                                            console.log("File opened")
                                        }
                                    })
                                
                             })
                        }).then(() => {
                       response.writeHead(200, {  
                            'Content-Type': 'application/json'  
                        });
                        response.write("Data Updated Successfully");  
                        response.end(); 
                        }).catch((err)=>{
                            console.log("err", err);
                        })
                    } else {
                        response.writeHead(401, {  
                            'Content-Type': 'application/json'  
                        });
                        response.write("No Record Found");  
                        response.end();
                    }
                    }
                );
                break; 
                case '/get_device_data':
                    try {

                        new sql.Request()
                        .query(
                            `SELECT DISTINCT DEVICENAME FROM HIST ORDER BY DEVICENAME`,
                            function (err, result) {
                            if (err) throw err;
                            response.writeHead(200, {  
                                'Content-Type': 'application/json'  
                            });
                            response.write(JSON.stringify(result.recordset));  
                            response.end(); 
                            });
        
                    } catch (err) {
                      console.error(err);
                    } finally {
                    }
                    break;   
                    case '/tas.jpg':  
                    const imagePath = pathimg.join(__dirname, 'tas.jpg');
                    const imageStream = fs.createReadStream(imagePath);
                    response.writeHead(200, {'Content-Type': 'image/jpeg' });
                    imageStream.pipe(response);
                    break;

                    case '/OTECH.jpg':  
                    const imagePath1 = pathimg.join(__dirname, 'OTECH.jpg');
                    const imageStream1 = fs.createReadStream(imagePath1);
                    response.writeHead(200, {'Content-Type': 'image/jpeg' });
                    imageStream1.pipe(response);
                    break;

                    case '/BPCL.png':  
                    const imagePath2 = pathimg.join(__dirname, 'BPCL.png');
                    const imageStream2 = fs.createReadStream(imagePath2);
                    response.writeHead(200, {'Content-Type': 'image/png' });
                    imageStream2.pipe(response);
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
