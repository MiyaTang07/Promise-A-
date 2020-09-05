/*
根据Promise/A+规范实现promise，使用promises+aplus
step1:了解promise规范
step2:实现promise
step3:测试
promises-tests
*/
const statusMap = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};
// 将promise设置为fulfilled状态
function fulfilledPromise(promise, value) {
  // 只能从pending状态转换为其他状态
  if (promise.status !== statusMap.PENDING) {
    return;
  }
  promise.status = statusMap.FULFILLED;
  promise.value = value;
  // promise状态改变时候执行callbacks
  runCbs(promise.fulfilledCbs, value);
}
// 将promise设置为rejected状态
function rejectedPromise(promise, reason) {
  // 只能从pending状态转换为其他状态
  if (promise.status !== statusMap.PENDING) {
    return;
  }
  promise.status = statusMap.REJECTED;
  promise.reason = reason;
  // promise状态改变时候执行callbacks
  runCbs(promise.rejectedCbs, reason);
}

function isFunction(fn) {
  return Object.prototype.toString.call(fn).toLocaleLowerCase() === "[object function]"
}

// 执行promise的callbacks
function runCbs(cbs, value) {
  cbs.forEach((cb) => cb(value));
}

function isPromise(p) {
  return p instanceof Promise;
}
function isObject(obj) {
  return Object.prototype.toString.call(obj).toLocaleLowerCase() === "[object object]"
}
/***
 * promise的解析过程
 * 抽象模型[[Resolve]](promise, x)
 * 2.3.1 如果promise和x指向相同的值
 * 2.3.2 如果x是一个promise
 * 2.3.3 如果x是一个对象或一个函数
 * 2.3.4 如果x不是对象也不是函数
 */
function resolvePromise(promise, x) {
  // x 与promise相同
  if (promise === x) {
    rejectedPromise(promise, new TypeError("can not be the same"));
    return;
  }
  // x 是一个promise
  if (isPromise(x)) {
    if (x.status === statusMap.FULFILLED) {
      fulfilledPromise(promise, x.value);
      return;
    }
    if (x.status === statusMap.REJECTED) {
      rejectedPromise(promise, x.reason);
      return;
    }
    if (x.status === statusMap.PENDING) {
      x.then(
        () => {
          fulfilledPromise(promise, x.value);
        },
        () => {
          rejectedPromise(promise, x.reason);
        }
      );
      return;
    }
    return;
  }

  // x 是对象或者函数 对thenable的兼容
  if (isObject(x) || isFunction(x)) {
    let then;
    let called = false; // 保证promise只被调用一次
    try {
      then = x.then;
    } catch (error) {
      rejectedPromise(promise, error);
      return;
    }

    if (isFunction(then)) {
      try {
        then.call(
           x,
          (y) => {
            // 如果被called，就返回
            if (called) {
              return;
            }
            called = true;
            resolvePromise(promise, y);
          },
          (r) => {
            if (called) {
              return;
            }
            called = true;
            rejectedPromise(promise, r);
          }
        );
      } catch (error) {
        // resolvePromise或者rejectPromise已经被调用了，则忽略它。
        if (called) {
          return;
        }
        called = true;
        rejectedPromise(promise, error);
      }
      return;
    } else {
      // then不是一个函数，以x为值fulfill promise 
      fulfilledPromise(promise, x);
      return;
    }

    // x 不是对象或者函数
  } else {
    fulfilledPromise(promise, x);
    return;
  }
}

class Promise {
  constructor(fn) {
    this.status = statusMap.PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.fulfilledCbs = []; // then的fulfilled callbacks
    this.rejectedCbs = []; // then的rejected callbacks
    fn(
      (value) => {
        fulfilledPromise(this, value);
        //  resolvePromise(this, value)
      },
      (reason) => {
         rejectedPromise(this, reason);
      }
    );
  }
  // 两个参数
  then(onFulfilled, onRejected) {
    // 当前promise执行后生成新的promise
    const promise1 = this;
    const promise2 = new Promise(() => {});

    // 根据当前promise状态判断then方法的执行                
    if (promise1.status === statusMap.FULFILLED) {
      if (!isFunction(onFulfilled)) {
        return promise1;
      }
      // then方法里面异步执行，并且异常兼容
      setTimeout(() => {
        try {
          const x = onFulfilled(promise1.value);
          // 根据x的值来设定新promise的状态，即决议promise2
          resolvePromise(promise2, x);
        } catch (error) {
          rejectedPromise(promise2, error);
        }
      }, 0);
    }
    // 与fulfilled情况类似
    if (promise1.status === statusMap.REJECTED) {
      if (!isFunction(onRejected)) {
        return promise1;
      }
      setTimeout(() => {
        try {
          const x = onRejected(promise1.reason);
          resolvePromise(promise2, x);
        } catch (error) {
          rejectedPromise(promise2, error);
        }
      }, 0);
    }
    
    // promise1未决议状态，需要将callbacks存储，并且按顺序执行
    if (promise1.status === statusMap.PENDING) {
      // promise的决议值支持透传
      onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => value;
      onRejected = isFunction(onRejected) ? onRejected : (err) => { throw err; };

      // 需要用一个function包起来，因为需要将promise1的决议传入参数中
      promise1.fulfilledCbs.push(() => {
        // then方法里面的callbacks仍然需要异步去执行
        setTimeout(() => {
          try {
            const x = onFulfilled(promise1.value);
            resolvePromise(promise2, x);
          } catch (error) {
            rejectedPromise(promise2, error);
          }
        }, 0);
      });

      promise1.rejectedCbs.push(() => {
        setTimeout(() => {
          try {
            const x = onRejected(promise1.reason);
            resolvePromise(promise2, x);
          } catch (error) {
            rejectedPromise(promise2, error);
          }
        }, 0);
      });
    }
    return promise2;
  }
}

/*
测试工具：promises-aplus-tests ，运行测试用例需要钩子
测试方式：promises-aplus-tests XXX.js
*/

Promise.deferred = function () {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};
module.exports = Promise;
