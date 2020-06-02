class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = {... this.queryString };

      const excludedFields = ['page','sort', 'limit','fields']
      excludedFields.forEach(el => delete queryObj[el]);
    
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
      const parsedStr = JSON.parse(queryStr);
      if (Object.keys(parsedStr).includes("name")) {
        parsedStr.name = {$regex : new RegExp(`.*${parsedStr.name}.*`, 'i')}
      }
      this.query.find(parsedStr)
      return this;
    }
  
    sort() {
      if(this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ')
        this.query = this.query.sort(sortBy)
      }
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-createdAt -updatedAt -__v -createdBy -id')
      }
      
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1;
      const limit = this.queryString.limit * 1;
      const skip = ( page - 1) * limit;
      
      this.query = this.query.skip(skip).limit(limit);
          
      return this;
    }
  }

  module.exports = APIFeatures;