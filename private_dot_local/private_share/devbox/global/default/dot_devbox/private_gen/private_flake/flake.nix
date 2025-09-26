{
   description = "A devbox shell";

   inputs = {
     nixpkgs.url = "github:NixOS/nixpkgs/a918bb3594dd243c2f8534b3be01b3cb4ed35fd1?narHash=sha256-ynQxPVN2FIPheUgTFhv01gYLbaiSOS7NgWJPm9LF9D0%3D";
     nixpkgs-648f70.url = "github:NixOS/nixpkgs/648f70160c03151bc2121d179291337ad6bc564b";
   };

   outputs = {
     self,
     nixpkgs,
     nixpkgs-648f70,
   }:
      let
        pkgs = nixpkgs.legacyPackages.aarch64-darwin;
        nixpkgs-648f70-pkgs = (import nixpkgs-648f70 {
          system = "aarch64-darwin";
          config.allowUnfree = true;
          config.permittedInsecurePackages = [
          ];
        });
      in
      {
        devShells.aarch64-darwin.default = pkgs.mkShell {
          buildInputs = [
            (builtins.trace "downloading direnv@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/jx3qm446vnaz50kk6pjh4h5chn74ib2c-direnv-2.37.1";
              inputAddressed = true;
            }))
            (builtins.trace "downloading github-cli@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/i3pg3w9482dqw6wl7f2z5vn1c5bspk4b-gh-2.23.0";
              inputAddressed = true;
            }))
            (builtins.trace "downloading neovim@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/myh94zy2aqvnyx03macfp7ls0d1r8ad3-neovim-0.11.3";
              inputAddressed = true;
            }))
            (builtins.trace "downloading zellij@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/4ql4rynv5fmnhnbsapn682430iw8s46l-zellij-0.43.1";
              inputAddressed = true;
            }))
            (builtins.trace "downloading git@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/jn9byxgdjndngf0d2by0djg8gcdll7xc-git-2.50.1";
              inputAddressed = true;
            }))
            (builtins.trace "downloading fzf@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/1g47v585sy9mbp83bpr15xm00jk6zfqd-fzf-0.65.1";
              inputAddressed = true;
            }))
            (builtins.trace "downloading fzf@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/bi6hvv72zh2zqgagirqvpjddpyfb8jkq-fzf-0.65.1-man";
              inputAddressed = true;
            }))
            (builtins.trace "downloading bun@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/l08n46gh7klp2k7nyvmnx79f8p4hysfn-bun-1.2.19";
              inputAddressed = true;
            }))
            (builtins.trace "downloading nodejs@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/b1j05q96hwagn787p2jlgqcjg2nf5x49-nodejs-24.5.0";
              inputAddressed = true;
            }))
            (builtins.trace "downloading aerospace@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/14g3yzf9vflh19kggz43h72byr6bglj3-aerospace-0.19.2-Beta";
              inputAddressed = true;
            }))
            
            (builtins.trace "downloading lazygit@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/n7ny04dvvzhs8fpk6cx9rqa7fi227nll-lazygit-0.54.2";
              inputAddressed = true;
            }))
            (builtins.trace "downloading ripgrep@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/md9kfvsz7axcb5b1z2yw2mybi3lhxyha-ripgrep-14.1.1";
              inputAddressed = true;
            }))
            (builtins.trace "downloading fd@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/40nk6ri500aip6a34x8nnhr9k0ikgl8f-fd-10.2.0";
              inputAddressed = true;
            }))
            (builtins.trace "downloading wezterm@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/kmnr27swwlwlmc6zaax1yx3ml3vzay8b-wezterm-0-unstable-2025-07-10";
              inputAddressed = true;
            }))
            (builtins.trace "downloading ffmpeg@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/gkgrqbp39zvrbmkk1alq98sxxs0ra09i-ffmpeg-7.1.1-bin";
              inputAddressed = true;
            }))
            (builtins.trace "downloading ffmpeg@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/8dvz9qflvfzaq5gppmh8fzhs9qn8spjm-ffmpeg-7.1.1-man";
              inputAddressed = true;
            }))
            (builtins.trace "downloading tmux@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/hb9rmacsyjn2jbkfl12ax66qj9z86w8l-tmux-3.5";
              inputAddressed = true;
            }))
            (builtins.trace "downloading tmux@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/fzmxcplr3rqr0vm642fyschn4n43q43p-tmux-3.5-man";
              inputAddressed = true;
            }))
            (builtins.trace "downloading diff-so-fancy@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/6az982g3phqhlvkrkavn8a9g9alj0axw-diff-so-fancy-1.4.4";
              inputAddressed = true;
            }))
            (builtins.trace "downloading zoxide@latest" (builtins.fetchClosure {
              
              fromStore = "https://cache.nixos.org";
              fromPath = "/nix/store/16v06ajqjxc9k9ccnj1kykd1q83zkjli-zoxide-0.9.8";
              inputAddressed = true;
            }))
            (builtins.trace "evaluating nixpkgs-648f70-pkgs._1password-cli" nixpkgs-648f70-pkgs._1password-cli)
          ];
        };
      };
 }
