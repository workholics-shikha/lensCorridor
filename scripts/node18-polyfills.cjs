const defineMethod = (name, implementation) => {
  if (!Object.prototype.hasOwnProperty.call(Array.prototype, name)) {
    Object.defineProperty(Array.prototype, name, {
      value: implementation,
      configurable: true,
      writable: true,
    });
  }
};

defineMethod('toReversed', function toReversed() {
  return [...this].reverse();
});

defineMethod('toSorted', function toSorted(compareFn) {
  return [...this].sort(compareFn);
});

defineMethod('toSpliced', function toSpliced(start, deleteCount, ...items) {
  const clone = [...this];
  clone.splice(start, deleteCount, ...items);
  return clone;
});
