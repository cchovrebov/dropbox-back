const express = require('express')
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
const cors = require('cors');
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/tmp'));

// Add headers before the routes are defined
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// app.use(cors({
//   // origin: '*',
//   // methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS']
// }));

app.post('/files', (req, res) => {
  // const id = uuid.v4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  console.log(req.files);
  // if (!req.files || Object.keys(req.files).length === 0) {
  //   return res.status(400).send('No files were uploaded.');
  // }

  // for (let i = 0; i < req.files?.file?.length; i++) {
  //   const element = req.files?.file[i];
  //   const uploadPath = __dirname + '/tmp/' + element.name;

  //   try {
  //     element.mv(uploadPath, function (err) {
  //       if (err) return res.status(500).send(err);
  //     });
  //   } catch (e) {
  //     return res.status(500).send(e)
  //   }
  // }
  return res.send('File uploaded!');
});

app.get('/files', (req, res) => {
  console.log('Get files');

  const path = __dirname + '/tmp/';
  console.log(path);

  fs.readdir(path, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function (filename) {
      fs.readFile(path + filename, 'utf-8', function (err, content) {
        if (err) {
          // onError(err);
          return;
        }
        console.log(filename, content);
        // onFileContent(filename, content);
      });
    });
  });
  return res.send('OK!');
});

app.get('/photos', (req, res) => {
  const limit = req.query.limit;
  try {
    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      if (parseInt(limit)) {
        return res.send(JSON.parse(data).splice(0, parseInt(limit)));
      }
      return res.send(JSON.parse(data));
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.get('/photos/:id', (req, res) => {
  try {
    const photoId = req.params?.id
    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      const parsedData = JSON.parse(data);
      const photo = parsedData.find(item => item.id === photoId);
      if (!photo) {
        return res.status(404).send({
          message: "Photo with such id is not found"
        });
      }
      return res.send(photo);
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.patch('/photos/:id', (req, res) => {
  try {
    const photoId = req.params?.id;
    const body = req.body;
    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      const parsedData = JSON.parse(data);
      const photo = parsedData.find(item => item.id === photoId);
      if (!photo) {
        return res.status(404).send({
          message: "Photo with such id is not found"
        });
      }
      const updatedData = {
        ...photo,
        title: body?.title,
      };
      const updatedArr = parsedData.map(item => item.id === photo.id ? updatedData : item)
      fs.writeFileSync('photos.json', JSON.stringify(updatedArr));

      return res.send(updatedData);
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.delete('/photos', (req, res) => {
  try {
    const photoIds = req.body
    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      const parsedData = JSON.parse(data);
      const photos = parsedData.filter(item => photoIds.includes(item.id));

      if (!photos?.length) {
        return res.status(404).send("Photo with such id is not found");
      }
      const filteredData = parsedData.filter(item => !photoIds.includes(item.id));

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        const uploadPath = `${__dirname}/tmp/${photo.id}.${photo.mimetype.split('/')[1]}`;
        fs.unlinkSync(uploadPath);
        fs.writeFileSync('photos.json', JSON.stringify(filteredData), function (err) {
          if (err) return res.status(400).send(err);
        });
      }

      return res.send(filteredData);
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.delete('/photos/:id', (req, res) => {
  try {
    const photoId = req.params?.id;
    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      const parsedData = JSON.parse(data);
      const photo = parsedData.find(item => item.id === photoId);
      if (!photo) {
        return res.status(404).send({
          message: "Photo with such id is not found"
        });
      }

      const filteredData = parsedData.filter(item => item.id !== photoId);
      const uploadPath = `${__dirname}/tmp/${photo.id}.${photo.mimetype.split('/')[1]}`;
      fs.unlinkSync(uploadPath);
      fs.writeFileSync('photos.json', JSON.stringify(filteredData), function (err) {
        if (err) return res.status(400).send(err);

        return res.send(filteredData);
      });
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.post('/photos', (req, res) => {
  const file = req.files.file;
  try {
    const id = uuidv4();

    if (!file) {
      return res.status(400).send('No files were uploaded.');
    }
    const uploadPath = `${__dirname}/tmp/${id}.${file.mimetype.split('/')[1]}`;

    try {
      file.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });
    } catch (e) {
      return res.status(500).send(e)
    }

    fs.readFile('photos.json', (err, data) => {
      if (err) throw err;
      const parsedData = JSON.parse(data);
      const createdData = {
        id,
        title: file.name,
        size: file.size,
        date: new Date(),
        url: `http://localhost:${port}/${id}.${file.mimetype.split('/')[1]}`,
        mimetype: file.mimetype
      };
      parsedData.push(createdData);
      fs.writeFileSync('photos.json', JSON.stringify(parsedData));
      return res.send(createdData);
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
      error,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
