---
layout: single 

title:  "[Flutter]Widget" 
categories: Flutter
tag: [flutter]
toc: true
---



## Widget

레고블럭과 같다. 플러터에 있는 모든 것은 Widget을 레고블럭처럼 쌓아서 앱을 만든다.

**Widget을 만든 다는 것 == Class를 만든다는 것**

class를 widget으로 만들기 위해서는 3개의 core widget중 하나를 상속 받아야 한다. 

widget을 상속 받는 경우 반드시 `build`메소드를 구현해야 한다.

### build 메소드

flutter가 실행하게 된다. build 메소드가 무엇을 리턴하든지 그것을 화면에 띄운다. 즉 위젯의 UI를 빌드한다.

## Root Widget

앱의 시작점으로 모든 것이 이것으로부터 시작됨

Root Widget은 둘중 하나를 return해야 한다.

- MaterialApp
- CupertinoApp

이들은 각각 구글과 애플의 디자인 시스템이다.

즉 flutter에게 어떤 family style을 사용할지 알려주는 것

**보통 MaterialApp이 낫다**

## Scaffold

flutter 모바일 앱의 화면은 scaffold를 가져야한다.
