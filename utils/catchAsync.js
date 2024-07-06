module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err)); // .catch(next) this short hand to the catch
  };
};
