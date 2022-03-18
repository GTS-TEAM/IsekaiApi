async function test() {
  return await Promise.resolve('Test');
}

var text = await test();
console.log('test: ' + text);
