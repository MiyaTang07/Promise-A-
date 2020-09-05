### PromiseA+规范
### 1. 术语
“promise”是一个对象或函数，其then方法的行为符合此规范。
“thenable”是定义then方法的对象或函数。
“value”是任何合法的JavaScript值（包括undefined，一个thenable或一个promise）。
“exception”是使用该throw语句抛出的值。
“reason”是一个值，表明承诺被拒绝的原因。
### 2. 要求
#### 2.1 promise状态
一个Promise必须处在其中之一的状态：pending, fulfilled 或 rejected.

2.1.1. 如果是pending状态，则promise：
 1. 可以转换到fulfilled或rejected状态。

2.1.2. 如果是fulfilled状态，则promise：
 1. 不能转换成任何其它状态。
 2. 必须有一个值，且这个值不能被改变。

2.1.3. 如果是rejected状态,则promise可以：
 1. 不能转换成任何其它状态。
 2. 必须有一个原因，且这个值不能被改变。

“值不能被改变”指的是其identity不能被改变，而不是指其成员内容不能被改变。

####  2.2 then 方法
一个Promise必须提供一个then方法来获取其值或原因。
Promise的then方法接受两个参数：

```
promise.then(onFulfilled, onRejected)
```

2.2.1. onFulfilled 和 onRejected 都是可选参数：
  1. 如果onFulfilled不是一个函数，则忽略之。
  2. 如果onRejected不是一个函数，则忽略之。

2.2.2. 如果onFulfilled是一个函数:
  1. 它必须在promise fulfilled后调用， 且promise的value为其第一个参数。
  2. 它不能在promise fulfilled前调用。
  3. 不能被多次调用。

2.2.3. 如果onRejected是一个函数,
  1. 它必须在promise rejected后调用， 且promise的reason为其第一个参数。
  2. 它不能在promise rejected前调用。
  3. 不能被多次调用。

2.2.4. onFulfilled 和 onRejected 只允许在 执行上下文（execution context） 栈仅包含平台代码时运行. [3.1].

2.2.5. onFulfilled 和 onRejected 必须被当做函数调用 (i.e. 即函数体内的 this 为undefined). [3.2]

2.2.6. 对于一个promise，它的then方法可以调用多次.
  1. 当promise fulfilled后，所有onFulfilled都必须按照其注册顺序执行。
  2. 当promise rejected后，所有OnRejected都必须按照其注册顺序执行。

2.2.7. then 必须返回一个promise [3.3].
```
promise2 = promise1.then(onFulfilled, onRejected);
```

  1.  如果onFulfilled 或 onRejected 返回了值x, 则执行Promise 解析流程[[Resolve]](promise2, x).
  2. 如果onFulfilled 或 onRejected抛出了异常e, 则promise2应当以e为reason被拒绝。
  3. 如果 onFulfilled 不是一个函数且promise1已经fulfilled，则promise2必须以promise1的值fulfilled.
  4. 如果 onReject 不是一个函数且promise1已经rejected, 则promise2必须以promise1相同的reason被拒绝.

#### 2.3 Promise解析过程
Promise解析过程 是以一个promise和一个值做为参数的抽象过程，可表示为[[Resolve]](promise, x). 过程如下；

2.3.1. 如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。

2.3.2. 如果 x 是一个promise, 采用其状态 [3.4]:

  1. 如果x是pending状态，promise必须保持pending直到x为fulfilled或rejected.
  2. 如果x是fulfilled状态，将x的值用于fulfill promise.
  3. 如果x是rejected状态, 将x的原因用于reject promise.

2.3.3. 如果x是一个对象或一个函数：

  1. 将 then 赋为 x.then. [3.5]
  2. 如果在取x.then值时抛出了异常，则以这个异常做为原因将promise拒绝。
  3. 如果 then 是一个函数， 以x为this调用then函数， 且第一个参数是resolvePromise，第二个参数是rejectPromise，且：

    3.1 当 resolvePromise 被以 y为参数调用, 执行 [[Resolve]](promise, y).

    3.2 当 rejectPromise 被以 r 为参数调用, 则以r为原因将promise拒绝。

    3.3 如果 resolvePromise 和 rejectPromise 都被调用了，或者被调用了多次，则只第一次有效，后面的忽略。

    3.4 如果在调用then时抛出了异常，则：

      1）如果 resolvePromise 或 rejectPromise 已经被调用了，则忽略它。
      2）否则, 以e为reason将 promise 拒绝。

  4. 如果 then不是一个函数，则 以x为值fulfill promise。

2.3.4. 如果 x 不是对象也不是函数，则以x为值 fulfill promise。