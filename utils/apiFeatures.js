//////////

// we made this folder to make the getallmethods in better forms

/////////

class APIFeatures {
  constructor(query, queryString) {
    //query=queryObject=Tour.find(), queryString=req.query
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    //1a.filtering
    const queryObj = { ...this.queryString };
    const excludedFileds = ['page', 'sort', 'limit', 'fields'];
    excludedFileds.forEach((el) => delete queryObj[el]);

    //1b.Advance Filtiring
    let queryStr = JSON.stringify(queryObj); //JSON string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr)); // this contains query obj "Find"
    return this;
  }
  sort() {
    //SORT
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); // query is a query object so now we can use query methonds on it like sort()
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //fields
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    // pagniation
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
