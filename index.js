const Promise = require("./promise.origin");

Promise.deferred = function () {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};
const value = { a: 1 };
function TestPromise() {
  const res = new Promise((resolve, reject) => {
    setTimeout(() => resolve(value));
  });

  return res;
}

function main() {
  const t = TestPromise();
  t.then((value) => {
    const d = Promise.deferred();
    d.resolve(new Promise((resolve) => resolve(value)));
    return d.promise;
  }).then((value) => {
    console.log(value);
  });
}

main();
