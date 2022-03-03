---

layout: single 

title:  "[m1 macOS]Ruby와 rbenv 버전이 다름" 

---


깃허브 블로그를 만드는데 jekyll을 실행시키려고 아래 명령어를 쳤더니 오류가 났다.   
`bundle exec jekyll serve`

오류 메시지는 아래와 같았다.
```
/Library/Ruby/Gems/2.6.0/gems/ffi-1.15.5/lib/ffi/library.rb:275: [BUG] Bus Error at 0x000000010424c000
ruby 2.6.8p205 (2021-07-07 revision 67951) [universal.arm64e-darwin21]
```

이런 메시지가 뜬다.


```
> rbenv versions
  system
* 3.1.1 (set by /Users/hice/.rbenv/version)
> ruby -v
ruby 2.6.8p205 (2021-07-07 revision 67951) [universal.arm64e-darwin21]

> gem env home
/Library/Ruby/Gems/2.6.0
> gem install bundler
ERROR:  While executing gem ... (Gem::FilePermissionError)
    You don't have write permissions for the /Library/Ruby/Gems/2.6.0 directory.
```

rbenv로 설치한 ruby로 home path가 설정되지 않아서 생기는 문제인 것 같다.  
mac에는 ruby가 내장 되어있는데 매우 오래된 버전이다.
```
> which ruby
/usr/bin/ruby
```
`which ruby`로 ruby가 어디 설치되어있는지 확인 했을 때 위와 같다면 macOS system ruby를 사용중인 것이다.  
이때 `gem install`명령어를 사용하게 된다면 `/Library/Ruby/Gems/2.6.0`에 설치를 시도하게 되는데, 이 폴더는 `root`의 소유이다.  
따라서 permission 오류가 발생한다. 이때 sudo로 억지로 까는 것은 좋지 않다고 한다. 다른 버전을 깔자. 그렇다고 구버전 system ruby를 지우면 안 된다. macOS가 사용한다.

### Checking for rbenv shims in PATH: not found
rbenv를 삭제 후 다시 깔기로 했다.  
rbenv github 공식 문서를 따라갔다.

`brew install rbenv ruby-build`로 설치 후  
`rbenv init`  
이후 rbenv-doctor script로 확인했다.
`curl -fsSL https://github.com/rbenv/rbenv-installer/raw/main/bin/rbenv-doctor | bash`
이 때
```
Checking for `rbenv' in PATH: /opt/homebrew/bin/rbenv
Checking for rbenv shims in PATH: not found
  The directory `/Users/hice/.rbenv/shims' must be present in PATH for rbenv to work.
  Please run `rbenv init' and follow the instructions.

Checking `rbenv install' support: /opt/homebrew/bin/rbenv-install (ruby-build 20220218)
Counting installed Ruby versions: none
  There aren't any Ruby versions installed under `/Users/hice/.rbenv/versions'.
  You can install Ruby versions like so: rbenv install 3.1.1
Checking RubyGems settings: OK
Auditing installed plugins: OK
```
위와 같이 `Checking for rbenv shims in PATH: not found`가 떴다.  

```
echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
source ~/.bash_profile
```
위 명령어를 치니 해결되었다.

- https://github.com/rbenv/rbenv/issues/1217

### 해결
개뻘짓을 하고 있었다.
어떤 문서를 참고해도 gem의 home PATH가 안 바뀌어서 문제였다. ruby를 brew로 깔든, rbenv로 깔든 .zshrc파일을 수정하든, 무슨짓을 해도 안 바뀌었는데...  
그런데...  
`echo $PATH`를 보다가 뭔가 이상한 걸 발견했다.  
분명 `vim ~/.zshrc`로 확인했을 땐 환경변수가 훨씬 많은데, 중간에 끊겨있었다.  

**알고보니 export문에 공백문자가 하나 끼어있었다.**  
그 뒤 환경변수 설정은 싹다 무시돼서 PATH가 안 바뀌었던 것...
오기 때문에 붙잡고 몇시간 씨름했었는데 소리지르고 싶다..
진짜 정신차리자..

### gem permission 오류의 일반적인 해결방법

ruby version manager를 설치한다. 나는 `rbenv`를 사용했다.

`brew install rbenv ruby-build`

`rbenv install -l`로 검색해 최신버전을 받아준다.

`rbenv install <version>`

`rbenv rehash`이건 왜 하는지 모르겠는데 꼭 해야한단다.

`rbenv global <version>`방금 받은 버전으로 설정하면 된다.

## reference
- https://mac.install.guide/faq/do-not-use-mac-system-ruby/index.html
- https://mac.install.guide/ruby/index.html
- https://github.com/rbenv/rbenv
