const Book = require('../models/book');
const fs = require('fs');
const sharp = require('sharp');

exports.createBook = (req, res, next) => {
  
  req.body.book = JSON.parse(req.body.book);
  const url = req.protocol + '://' + req.get('host');

  
    // Optimize the image with Sharp
  const optimizedFilename = 'optimized-' + req.file.filename;
    sharp(req.file.path)
    .resize(500) 
    .jpeg({ quality: 80 })
    .toFile('images/' + optimizedFilename);

  const book = new Book({
    userId: req.body.book.userId,
    title: req.body.book.title,
    author: req.body.book.author,
    imageUrl: url + '/images/' + optimizedFilename ,
    year: req.body.book.year,
    genre: req.body.book.genre,
    averageRating: 0, 
    ratings: []      
  });

  book.save()
    .then(() => {
      res.status(201).json({ message: 'Book created successfully!' });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
 

//Get All Books
exports.getAllBook = (req, res, next) => {
    Book.find().then(
      (books) => {
        res.status(200).json(books);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
};

//Get One Book
exports.getOneBook = (req, res, next) => {
    Book.findOne({
    _id: req.params.id
    }).then(
    (book) => {
        res.status(200).json(book);
    }
    ).catch(
    (error) => {
        res.status(404).json({
        error: error
        });
    }
    );
};


//Modify a Book
exports.modifyBook = (req, res, next) => {
    let book = new Book({ _id: req.params._id });
    if (req.file) {
      const url = req.protocol + '://' + req.get('host');
      req.body.book = JSON.parse(req.body.book);
      book = {
        _id: req.params.id,
        title: req.body.book.title,
        imageUrl: url + '/images/' + req.file.filename,
        userId: req.body.book.userId,
        author: req.body.book.author,
        year: req.body.book.year,
        genre: req.body.book.genre,
        averageRating: 0, 
        ratings: []  
      };
    } else {
      book = {
        _id: req.params.id,
        title: req.body.title,
        imageUrl: req.body.imageUrl,
        userId: req.body.userId,
        author: req.body.author,
        year: req.body.year,
        genre: req.body.genre,
        averageRating: 0, 
        ratings: []  
      };
    }
    Book.updateOne({_id: req.params.id}, book).then(
      () => {
        res.status(201).json({
          message: 'Book updated successfully!'
        });
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
};


exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id}).then(
      (book) => {
        if (!book) {
            return res.status(404).json({
              error: new Error('Objet not found !')
            });
          }
          if (book.userId !== req.auth.userId) {
            return res.status(401).json({
              error: new Error('Requete not  !')
            });
        }
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink('images/' + filename, () => {
          Book.deleteOne({_id: req.params.id}).then(
            () => {
              res.status(200).json({
                message: 'Deleted!'
              });
            }
          ).catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            }
          );
        });
      }
    );
};




// Rate a book
exports.rateBook = (req, res) => {
    const bookId = req.params.id;
    const { userId, rating } = req.body;
  
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }
  
    Book.findById(bookId)
      .then((book) => {
        if (!book) {
          return res.status(404).json({ error: 'Book not found' });
        }
  
        const alreadyRated = book.ratings.some(r => r.userId === userId);
        if (alreadyRated) {
          return res.status(400).json({ error: 'User already rated this book' });
        }
  
        book.ratings.push({ userId, grade: rating });
  
        const totalRatings = book.ratings.length;
        const sumRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
        book.averageRating = sumRatings / totalRatings;
  
        return book.save();
      })
      .then((updatedBook) => {
        if (updatedBook) {
          res.status(200).json(updatedBook);
        }
      })
      .catch((error) => {
        res.status(500).json({ error: 'Server error while rating book' });
      });
    };
  



// Get top 3 best rated books
exports.getBestRatedBooks =  (req, res, next) => {
    Book.find().sort({'averageRating': -1}).limit(3)
      .then(
        (books) => {
          res.status(200).json(books);
        }
      ).catch(
        (error) => {
          res.status(400).json({
            error: error
          });
        }
    );
};
  


