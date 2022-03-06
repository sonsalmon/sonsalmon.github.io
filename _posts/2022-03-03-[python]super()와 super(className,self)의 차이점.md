---
layout: single 
title:  "[python]super()와 super(className, self)의 차이점" 
categories: python
tag: [python, syntax, method]
toc: true
---
# super()

> *class* __super__([*type*[, *object-or-type*]])
>
> Return a proxy object that delegates method calls to a parent or sibling class of *type*. This is useful for accessing inherited methods that have been overridden in a class.



python에서 `supuer()`메서드는 슈퍼클래스(부모 클래스)의 임시 객체(temporal object)를 반환한다. 따라서 자식 클래스는 `super().methodName()`과 같이 부모의 메서드에 접근 가능하다. 오버라이드된 메서드를 사용할 때 유용하다. 

## 예제

### 상속을 사용하지 않을 때

아래는 직사각형과 정사각형 클래스와 각각의 넓이와 둘레를 구하는 메서드이다.

```python
class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * self.length + 2 * self.width

class Square:
    def __init__(self, length):
        self.length = length

    def area(self):
        return self.length * self.length

    def perimeter(self):
        return 4 * self.length
```

위와 같이 `area()`와 `perimeter()`메서드는 겹치지만 각각 적어주게된다.  정사각형(Square)은 직사각형(Rectangle)의 특수한 경우이므로 상속을 이용해 구현해보자

## super() (single inheritance)

```python
class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * self.length + 2 * self.width

# Here we declare that the Square class inherits from the Rectangle class
class Square(Rectangle):
    def __init__(self, length):
        super().__init__(length, length)
```

```python
>>> square = Square(4)
>>> square.area()
16
```



`Square`클래스의 생성자는 `super().__init__`를 호출하는 데 이것은 Rectangle클래스의 생성자 즉, `Ractangle.__init__`를 호출하는 것이다. Square는 Rectangle의 메서드를 상속받으므로 `.area()`메서드를 사용할 수 있다. 이때 `.area()`는 `Rectangle.length`와 `Rectangle.width`를 사용하기 때문에 `super().__init__(length, length)`를 통해 초기화 한 것이다.

그렇다면 `super(클래스이름, self)`와 같은 건 뭘까?

### super(클래스 이름, self)

```python
class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * self.length + 2 * self.width

class Square(Rectangle):
    def __init__(self, length):
        super(Square, self).__init__(length, length)
```

 위 코드에서 `super(Square, self)`는 이전 코드의 `super()`와 같은 기능을 한다. Square의 상위 클래스에서 `__init()__`을 찾는 것이다.

아래의 코드에서는 조금 다르다.

```python
class Cube(Square):
    def surface_area(self):
        face_area = super(Square, self).area()
        return face_area * 6

    def volume(self):
        face_area = super(Square, self).area()
        return face_area * self.length
```

Square를 상속한 Cube이다. 메서드를 보면 `super(Square, self)`를 사용한다. 

이 경우에는 `.area()`메서드를 Square의 슈퍼 클래스 즉, Rectangle에서 찾게 된다. 

이 예에서는 그렇지 않지만 Square에서도 `.area()`메서드를 구현했다고 생각해보자. 만약 Cube에서 그냥 `super().area()`를 호출한다면 Square에 구현된 `.area()`를 호출하게 될 것이다. `super()`에 첫번째 인자로 Square를 줌으로써 Square의 부모클래스의 메서드에 접근이 가능하게 된다. 

# References

## References

- https://realpython.com/python-super/
- https://docs.python.org/3/library/functions.html#super