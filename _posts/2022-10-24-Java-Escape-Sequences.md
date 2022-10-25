---
layout: post
title: (Java) Escape Sequences
# author: Hee
description: Java의 Escape Sequences(탈출문)에 대해 알아보고 이를 실제 출력해보자.
tags: [java, java escape, escape sequences, java lineSeparator, 자바, 자바 탈출문, 자바 개행, 자바 줄바꿈]
categories: [Programming, Java]
date: '2022-10-24'
image:
    path: /assets/img/thum/java_escape_sequences.png
    width: 600
    height: 200
    alt: Java Escape Sequences
---

>Java에서 특수문자를 출력하기 위해서는 어떻게 해야 할까?<br/>물론 Java에서 제공하는 기본 출력 명령어인 System.out.println();을 사용하면 된다.<br/>그러나 모든 특수문자를 그리 쉽게 출력할 수 있는 것은 아니다.

## Java Escape Sequences

```java
public static void main(String[] args) {
	System.out.println("`");
	System.out.println("~");
	System.out.println("!");
	System.out.println("@");
	System.out.println("#");
	System.out.println("$");
	System.out.println("%");
	System.out.println("^");
	System.out.println("&");
	System.out.println("*");
	System.out.println("(");
	System.out.println(")");
	System.out.println("-");
	System.out.println("_");
	System.out.println("=");
	System.out.println("+");
	System.out.println("[");
	System.out.println("{");
	System.out.println("]");
	System.out.println("}");
	System.out.println("\");	// 문제 발생
	System.out.println("|");
	System.out.println(";");
	System.out.println(":");
	System.out.println("'");
	System.out.println(""");	// 문제 발생
	System.out.println(",");
	System.out.println("<");
	System.out.println(".");
	System.out.println(">");
	System.out.println("/");
	System.out.println("?");
}
```

다른 특수문자는 문제가 없지만, **\\**(백슬래시 혹은 역슬래시라고 함)와 **"**(큰 따옴표)는 문제가 된다.

Java에서 특수문자를 다루는 방법은 이미 정해져 있다. 해당 내용은 [**Oracle의 Java 관련 튜토리얼**](https://docs.oracle.com/javase/tutorial/java/data/characters.html)에 자세히 명시되어 있다.

해당 문서의 **Escape Sequences**를 보면, 특수문자나 특별한 의미를 가진 탈출 문자를 알 수 있다.

<img src="/assets/img/thum/java_escape_sequences.png" width="800" />

번역하자면,
- **\t**는 tab 역할을 한다. (띄어쓰기 4번 정도의 간격, 코드를 들여쓰기 할 때 tab을 사용함)
- **\b**는 backspace 역할을 한다.
- **\n**은 개행(줄바꿈) 역할을 한다.
- **\r**도 개행 역할을 한다.
- **\f**는 프린트 출력 시 현재 페이지 마침 역할을 한다.
- <b>\\'</b>는 <b>'</b>를 출력한다.
- <b>\\"</b>는 <b>"</b>를 출력한다.
- <b>\\\\</b>는 <b>\\</b>를 출력한다.

즉, 위 Java 코드 속 문제를 해결하기 위해서는

```java
System.out.println("\\");
System.out.println("\"");
```

위와 같이 변경해야 정상적으로 출력할 수 있게 된다.

## 탈출문
이번엔 위에서 설명한 **탈출문**에 대해 알아보자.

```java
public static void main(String[] args) {
	System.out.println("안녕\t하세요");
	System.out.println("안녕\b하세요");
	System.out.println("안녕\n하세요");
	System.out.println("안녕\r하세요");
	System.out.println("안녕\f하세요");
}
```

위의 코드를 실행 시키면 다음과 같은 결과가 출력된다.

<img src="/assets/img/post/java_escape_print.png" />

**\\t**나 **\\n**, **\\r**은 설명한 대로 결과가 나오지만 **\\b**나 **\\f**는 알 수 없는 기호가 포함되어 출력된다. 이에 대해 [**StackOverFlow**](https://stackoverflow.com/questions/46263725/what-is-the-use-of-f-character-where-is-to-use-it)에서 힌트를 얻을 수 있었다.
해당 링크에 따르면, 옛날에는 프린터가 **ASCII**로 사용 되었기 때문에 프린터를 제어하기 위해 사용된 탈출문이 존재한다는 것이다.
즉, 지금은 사용하지 않는 탈출문이다.

그렇다면, \\n과 \\r은 어떤 차이가 있을까?
둘 다 개행 역할을 하기 때문에 둘 중에 아무거나 써도 된다는 의미는 절대 아닐 것이다.
모든 시스템이나 운영체제에는 출력 기능이 반드시 들어있는데, 각 시스템마다 개행 역할을 하는 명령어가 다르다.
\\n은 unix에서 사용되고. \\r은 mac, \\r\\n은 window에서 사용된다.

## System.lineSeparator();

당신이 만약 **window** 환경에서 Java 개발을 하던 중 개발 환경을 **mac**으로 바꾸게 된다면, 개행 문자를 모조리 다 바꿔야 할 것이다. 이를 방지하기 위해 **Java 1.7** 버전부터 제공하는 **System.lineSeparator()** 메소드를 사용하는 것이 좋다.

[**Java8 API**](https://docs.oracle.com/javase/8/docs/api/)에서 찾아보면 알 수 있듯이 시스템의 개행 명령어를 유닉스(\\n), 맥(\\r), 윈도우(\\r\\n) 상관 없이 항상 동일한 값을 반환한다.

<img src="/assets/img/post/java_lineSeparator.png" />

직접 코드를 활용해보면, 다음과 같다.

```java
System.out.println("안녕" + System.lineSeparator() + "하세요");
```

**lineSeparator()**는 개발 환경을 바꿨을  때나 출력을 담당하는 시스템이 바뀌어도 언제나 개행을 해주기 때문에 다른 개행 문자 대신 사용하는 것을 권장한다.

